# Hướng dẫn liên kết Google Sheets làm Backend cho Dự đoán WC 2026

File này chứa đoạn mã **Google Apps Script** cần thiết để biến file Google Sheets của bạn thành một cơ sở dữ liệu (backend) xử lý dữ liệu dự đoán, ghi nhận IP chống fake và tự động đồng bộ lên giao diện Web.

---

## Bước 1: Chuẩn bị Google Sheet

1. Tạo một trang tính **Google Sheets** mới trên Google Drive của bạn.
2. Tạo sẵn **4 Sheet con** (nhìn ở góc dưới cùng màn hình) và đặt tên chính xác như sau:
   - `Predictions` (Lưu lịch sử dự đoán của người chơi)
   - `Matches` (Lưu kết quả các trận đấu do Admin cập nhật)
   - `KnockoutTeams` (Lưu thông tin đội bóng ở các vòng đấu loại trực tiếp)
   - `LockedMatches` (Lưu cài đặt khóa dự đoán thủ công)
3. Điền tiêu đề cột cho dòng đầu tiên ở các sheet để dễ quản lý (không bắt buộc nhưng nên làm):
   - Sheet `Predictions`: Cột A: `Timestamp`, Cột B: `MA_USER`, Cột C: `IP_Address`, Cột D: `Predictions_JSON`
   - Sheet `Matches`: Cột A: `Match_Id`, Cột B: `Result`
   - Sheet `KnockoutTeams`: Cột A: `Match_Id`, Cột B: `Team_A`, Cột C: `Team_B`, Cột D: `Team_A_Name`, Cột E: `Team_B_Name`
   - Sheet `LockedMatches`: Cột A: `Match_Id`, Cột B: `Is_Locked`

---

## Bước 2: Thiết lập Google Apps Script

1. Trên menu của Google Sheets, chọn **Tiện ích mở rộng (Extensions)** &gt; **Apps Script**.
2. Xóa toàn bộ mã mặc định trong khung soạn thảo.
3. Sao chép và dán toàn bộ đoạn mã dưới đây vào:

```javascript
// --- GOOGLE APPS SCRIPT CODE ---

// Hàm xử lý yêu cầu GET: Đọc dữ liệu từ Sheets gửi về cho React web
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Đọc danh sách dự đoán (lấy bản ghi mới nhất của từng MA_USER)
  var predSheet = ss.getSheetByName("Predictions");
  var players = [];
  if (predSheet) {
    var data = predSheet.getDataRange().getValues();
    var latestUserPredictions = {};
    
    // Bỏ qua dòng tiêu đề (i = 0), duyệt từ dòng 1 đến hết
    for (var i = 1; i < data.length; i++) {
      var timestamp = data[i][0];
      var maUser = data[i][1];
      var ip = data[i][2];
      var predJson = data[i][3];
      
      if (maUser && predJson) {
        // Chỉ lưu bản ghi có timestamp mới nhất
        if (!latestUserPredictions[maUser] || new Date(timestamp) > new Date(latestUserPredictions[maUser].lastUpdated)) {
          try {
            latestUserPredictions[maUser] = {
              id: maUser,
              predictions: JSON.parse(predJson),
              ip: ip,
              lastUpdated: new Date(timestamp).toISOString()
            };
          } catch(e) {}
        }
      }
    }
    
    // Chuyển object thành array
    players = Object.keys(latestUserPredictions).map(function(key) {
      return latestUserPredictions[key];
    });
  }
  
  // 2. Đọc kết quả trận đấu thực tế
  var matchSheet = ss.getSheetByName("Matches");
  var matchesResults = {};
  if (matchSheet) {
    var mData = matchSheet.getDataRange().getValues();
    for (var j = 1; j < mData.length; j++) {
      var matchId = mData[j][0];
      var result = mData[j][1];
      if (matchId) {
        matchesResults[matchId] = result || null;
      }
    }
  }
  
  // 3. Đọc thông tin các đội chơi vòng loại trực tiếp
  var koSheet = ss.getSheetByName("KnockoutTeams");
  var knockoutTeams = {};
  if (koSheet) {
    var koData = koSheet.getDataRange().getValues();
    for (var k = 1; k < koData.length; k++) {
      var koMatchId = koData[k][0];
      if (koMatchId) {
        knockoutTeams[koMatchId] = {
          teamA: koData[k][1] || "",
          teamB: koData[k][2] || "",
          teamAName: koData[k][3] || "",
          teamBName: koData[k][4] || ""
        };
      }
    }
  }

  // 4. Đọc trạng thái khóa trận đấu hoặc cấu hình điểm phạt
  var lockSheet = ss.getSheetByName("LockedMatches");
  var lockedMatches = {};
  if (lockSheet) {
    var lockData = lockSheet.getDataRange().getValues();
    for (var l = 1; l < lockData.length; l++) {
      var lockMatchId = lockData[l][0];
      var val = lockData[l][1];
      if (lockMatchId) {
        if (val === "true" || val === true) {
          lockedMatches[lockMatchId] = true;
        } else if (val === "false" || val === false) {
          lockedMatches[lockMatchId] = false;
        } else {
          // Giữ nguyên giá trị số/chuỗi cho cấu hình điểm phạt
          lockedMatches[lockMatchId] = val;
        }
      }
    }
  }
  
  // Trả về JSON kết quả
  var output = {
    players: players,
    matchesResults: matchesResults,
    knockoutTeams: knockoutTeams,
    lockedMatches: lockedMatches
  };
  
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// Hàm xử lý yêu cầu POST: Nhận dữ liệu từ React gửi lên và ghi vào Sheets
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var payload;
  
  try {
    payload = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Invalid JSON"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = payload.action;
  
  if (action === "submitPrediction") {
    // 1. Thêm dự đoán mới của người chơi
    var predSheet = ss.getSheetByName("Predictions");
    if (!predSheet) {
      predSheet = ss.insertSheet("Predictions");
    }
    
    // Ghi dòng mới: [Thời gian, Mã User, IP, JSON dự đoán]
    predSheet.appendRow([
      payload.timestamp || new Date().toISOString(),
      payload.ma_user,
      payload.ip,
      JSON.stringify(payload.predictions)
    ]);
    
  } else if (action === "updateResults") {
    // 2. Admin cập nhật kết quả trận đấu & danh sách đội knockout
    var matchSheet = ss.getSheetByName("Matches");
    if (matchSheet) {
      matchSheet.clear();
      matchSheet.appendRow(["Match_Id", "Result"]);
      Object.keys(payload.matchesResults).forEach(function(key) {
        matchSheet.appendRow([key, payload.matchesResults[key]]);
      });
    }
    
    var koSheet = ss.getSheetByName("KnockoutTeams");
    if (koSheet) {
      koSheet.clear();
      koSheet.appendRow(["Match_Id", "Team_A", "Team_B", "Team_A_Name", "Team_B_Name"]);
      Object.keys(payload.knockoutTeams).forEach(function(key) {
        var teamInfo = payload.knockoutTeams[key];
        koSheet.appendRow([
          key,
          teamInfo.teamA,
          teamInfo.teamB,
          teamInfo.teamAName,
          teamInfo.teamBName
        ]);
      });
    }
    
  } else if (action === "updateLocks") {
    // 3. Admin cập nhật trạng thái khóa các trận đấu
    var lockSheet = ss.getSheetByName("LockedMatches");
    if (lockSheet) {
      lockSheet.clear();
      lockSheet.appendRow(["Match_Id", "Is_Locked"]);
      Object.keys(payload.lockedMatches).forEach(function(key) {
        lockSheet.appendRow([key, payload.lockedMatches[key]]);
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Bước 3: Triển khai làm Web App (Web app)

1. Nhấn nút **Lưu (Save)** ở trên cùng.
2. Nhấn nút **Triển khai (Deploy)** &gt; **Tùy chọn triển khai mới (New deployment)**.
3. Trong ô cấu hình:
   - Chọn loại là **Ứng dụng web (Web app)** (click vào bánh răng cưa nếu chưa thấy).
   - *Mô tả (Description)*: Nhập `WC 2026 Predictions Backend`.
   - *Thực thi dưới dạng (Execute as)*: Chọn **Tôi (Me / email của bạn)**.
   - *Ai có quyền truy cập (Who has access)*: Chọn **Mọi người (Anyone)** (Đây là phần cực kỳ quan trọng để React App của người chơi có thể gửi dự đoán lên).
4. Nhấn nút **Triển khai (Deploy)**.
5. Google sẽ yêu cầu bạn cấp quyền truy cập tài khoản. Hãy nhấn **Ủy quyền truy cập (Authorize access)**, chọn email của bạn, chọn **Nâng cao (Advanced)** (góc dưới bên trái), và click vào đường dẫn **Đi tới Dự án không an toàn (Go to Web App (unsafe))**, cuối cùng chọn **Cho phép (Allow)**.
6. Sao chép đường dẫn **URL ứng dụng web (Web app URL)** (đường dẫn có dạng `https://script.google.com/macros/s/.../exec`).

---

## Bước 4: Kết nối với ứng dụng Web

1. Vào giao diện Web Dự đoán vừa dựng.
2. Nhấn nút **Admin** ở góc trên cùng bên phải.
3. Nhập mật khẩu là `admin123` (hoặc nhấn Xác nhận luôn nếu chưa cài mật khẩu).
4. Ở phần **1. Kết nối Google Sheets API**, dán đường dẫn **Web App URL** vừa copy ở Bước 3 vào.
5. Nhấn **Lưu cấu hình**, sau đó nhấn **Đồng bộ Sheets**.
6. Web của bạn đã được kết nối với Google Sheets! Bây giờ, mọi dự đoán và cập nhật sẽ được lưu thẳng vào file Excel Google Drive của bạn một cách an toàn và bảo mật.
