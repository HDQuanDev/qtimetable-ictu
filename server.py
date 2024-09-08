from flask import Flask, request, jsonify
from werkzeug.exceptions import BadRequest
import os
import json, time
import pandas as pd
import re
from playwright.sync_api import sync_playwright

app = Flask(__name__)

def get_tkb_and_exam_schedule(username, password):
    url = "http://dangkytinchi.ictu.edu.vn/"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        try:
            page.goto(url, timeout=30000)
            page.wait_for_load_state('networkidle')
            
            page.fill('input[name="txtUserName"]', username)
            page.fill('input[name="txtPassword"]', password)
            page.click('input[name="btnSubmit"]')
            
            page.wait_for_load_state('networkidle')
            
            element = page.query_selector('#PageHeader1_lblUserFullName')
            if element and element.text_content().strip() != "Khách":
                # Download TKB
                page.click('a[href="/kcntt/Home.aspx"]')
                page.wait_for_load_state('networkidle')
                page.click('a[href="/kcntt/Reports/Form/StudentTimeTable.aspx"]')
                page.wait_for_load_state('networkidle')
                
                # Chọn giá trị từ thẻ <select>
                page.select_option('select[name="drpTerm"]', '1')  # Chọn giá trị "1"
                page.wait_for_load_state('networkidle')  # Đợi trang tải lại sau khi chọn giá trị
    
                with page.expect_download() as download_info:
                    page.click('input[name="btnView"]')
                download = download_info.value
                if download:
                    download.save_as("TKB_exported.xls")
                    print("TKB downloaded as TKB_exported.xls")
                else:
                    print("Failed to download TKB")

                # Get exam schedule
                try:
                    page.click('a[href="/kcntt/StudentViewExamList.aspx"]')
                    page.wait_for_load_state('networkidle')
                    
                    find_tblCourseList = page.query_selector('#tblCourseList')
                    if not find_tblCourseList:
                        print("No exam schedule found.")
                        return True  # Trả về True nếu không có dữ liệu
                    rows = page.query_selector_all('#tblCourseList tr')
                    # Kiểm tra hàng đầu tiên
                    first_row = rows[1]
                    first_td = first_row.query_selector('td[colspan="10"][height="1"][bgcolor="#003399"]')
                    if first_td:
                        print("Found the specific <td> in the first row. Stopping the process.")
                        return True  # Trả về True nếu không có dữ liệu
                    data = []
                    for row in rows[1:-1]:  # Skip header row
                        cols = row.query_selector_all('td')
                        row_data = [col.inner_text() for col in cols]
                        data.append(row_data)

                    # Create DataFrame
                    columns = ['STT', 'ma_hoc_phan', 'ten_hoc_phan', 'so_tc', 'ngay_thi', 'ca_thi', 'hinh_thuc_thi', 'so_bao_danh', 'phong_thi', 'ghi_chu']
                    df = pd.DataFrame(data, columns=columns)
                
                    return df
                except Exception as e:
                    print(f"Error occurred while getting exam schedule: {e}")
                    return True  # Trả về True nếu có lỗi xảy ra
            else:
                print("Login failed or user is not authenticated.")
                return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        finally:
            browser.close()

def extract_week_info(week_str):
    pattern = r"Tuần (\d+) \((\d{2}/\d{2}/\d{4}) đến (\d{2}/\d{2}/\d{4})\)"
    match = re.match(pattern, week_str)
    if match:
        week_number = match.group(1)
        start_date = match.group(2)
        end_date = match.group(3)
        return week_number, start_date, end_date
    return None, None, None

def excel_to_structured_json(excel_file, data_lichthi = None):
    if not os.path.exists(excel_file) or os.path.getsize(excel_file) == 0:
        return None

    try:
        df = pd.read_excel(excel_file, engine='xlrd', header=None)
        columns = ['STT', 'lop_hoc_phan', 'giang_vien', 'thu', 'tiet_hoc', 'dia_diem', 'tuan_hoc']
        result = {"user_info": {}, "thoikhoabieu": [], "lichthi": []}
        if data_lichthi is not None:
            result["lichthi"].append(data_lichthi)
        current_week = None

        for index, row in df.iterrows():
            if index == 0:
                continue  # Skip the header row

            # Detect week information
            if pd.notna(row[1]) and isinstance(row[1], str) and 'Tuần' in row[1]:
                week_number, start_date, end_date = extract_week_info(row[1].strip())
                current_week = {
                    "week_number": week_number,
                    "start_date": start_date,
                    "end_date": end_date,
                    "data": []
                }
                result["thoikhoabieu"].append(current_week)
                continue

            # Detect student information
            if pd.notna(row[1]) and isinstance(row[1], str) and 'Sinh viên :' in row[1]:
                result["user_info"]["name"] = row[2].split(' - ')[1]
                result["user_info"]["masinhvien"] = row[2].split(' - ')[0]
                continue

            if pd.notna(row[1]) and isinstance(row[1], str) and 'Ngành :' in row[1]:
                result["user_info"]["nganh"] = row[2]
                continue

            if pd.notna(row[1]) and isinstance(row[1], str) and 'Khóa :' in row[1]:
                result["user_info"]["khoa"] = row[2]
                continue

            # Process class data
            if pd.notna(row[0]) and pd.notna(row[1]) and current_week is not None:
                class_data = {
                    columns[0]: row[0],
                    columns[1]: row[1],
                    columns[2]: row[2],
                    columns[3]: row[3],
                    columns[4]: row[4],
                    columns[5]: row[5],
                    columns[6]: current_week["week_number"]
                }
                current_week["data"].append(class_data)
        os.remove(excel_file)
        return result

    except Exception as e:
        return {"details": str(e), "error": "An unexpected error occurred"}
    
@app.route('/get_tkb', methods=['POST'])
def get_tkb_api():
    try:
        data = request.get_json()
        username = data['username']
        password = data['password']
        
        if not username or not password:
            raise BadRequest('Missing username or password')
        
        exam_schedule = get_tkb_and_exam_schedule(username, password)
        if exam_schedule is not None:
            data_lichthi = exam_schedule.to_dict(orient='records')
            excel_file = "TKB_exported.xls"
            
            result = excel_to_structured_json(excel_file, data_lichthi)
            if result is None:
                return jsonify({"error": "Failed to process timetable data"}), 500
            return jsonify(result)
        elif exam_schedule == True:
            excel_file = "TKB_exported.xls"
            result = excel_to_structured_json(excel_file)
            if result is None:
                return jsonify({"error": "Failed to process timetable data"}), 500
            return jsonify(result)
        else:
            return jsonify({"error": "Failed to get timetable"}), 500
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
