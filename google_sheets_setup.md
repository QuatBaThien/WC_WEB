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

// ============================================================
//  WORLD CUP 2026 — GOOGLE APPS SCRIPT (BẢN ĐẦY ĐỦ + ZAFRONIX)
//  Bao gồm: Predictions, Matches, KnockoutTeams, LockedMatches,
//           MatchesDetails, Accounts
// ============================================================

// --- CẤU HÌNH ZAFRONIX API KEYS ---
const ZAFRONIX_API_KEYS = [
  "zwc_free_3d6c76ad6a8ed84b79007767",
  "zwc_free_950648f2b2b4679407f00cbd",
  "zwc_free_3bc2e5f75ca15d8e43b6df60",
  "zwc_free_1b63d7789ef5f04db97b94e2"
];

// Bản đồ dịch tên quốc gia sang mã đội bóng (3 chữ cái)
const TEAM_NAME_TO_CODE = {
  "mexico": "MEX",
  "south africa": "RSA",
  "south korea": "KOR", "korea republic": "KOR",
  "czech republic": "CZE", "czechia": "CZE",
  "canada": "CAN",
  "bosnia and herzegovina": "BIH", "bosnia": "BIH",
  "qatar": "QAT",
  "switzerland": "SUI",
  "brazil": "BRA",
  "morocco": "MAR",
  "haiti": "HAI",
  "scotland": "SCO",
  "united states": "USA", "usa": "USA", "us": "USA",
  "paraguay": "PAR",
  "australia": "AUS",
  "turkey": "TUR", "türkiye": "TUR",
  "germany": "GER",
  "curacao": "CUW", "curaçao": "CUW",
  "ivory coast": "CIV", "côte d'ivoire": "CIV", "cote d'ivoire": "CIV",
  "ecuador": "ECU",
  "netherlands": "NED",
  "japan": "JPN",
  "sweden": "SWE",
  "tunisia": "TUN",
  "belgium": "BEL",
  "egypt": "EGY",
  "iran": "IRN", "ir iran": "IRN",
  "new zealand": "NZL",
  "spain": "ESP",
  "cape verde": "CPV", "cabo verde": "CPV",
  "saudi arabia": "KSA",
  "uruguay": "URU",
  "france": "FRA",
  "senegal": "SEN",
  "iraq": "IRQ",
  "norway": "NOR",
  "argentina": "ARG",
  "austria": "AUT",
  "jordan": "JOR",
  "algeria": "ALG",
  "portugal": "POR",
  "democratic republic of the congo": "COD", "dr congo": "COD", "congo dr": "COD",
  "uzbekistan": "UZB",
  "colombia": "COL",
  "england": "ENG",
  "croatia": "CRO",
  "ghana": "GHA",
  "panama": "PAN"
};

// Bản đồ dịch mã đội bóng sang tên Tiếng Việt (để lưu vào KnockoutTeams)
const TEAM_CODE_TO_VN = {
  "MEX": "Mexico", "RSA": "Nam Phi", "KOR": "Hàn Quốc", "CZE": "CH Séc",
  "CAN": "Canada", "BIH": "Bosnia", "QAT": "Qatar", "SUI": "Thụy Sĩ",
  "BRA": "Brazil", "MAR": "Morocco", "HAI": "Haiti", "SCO": "Scotland",
  "USA": "Mỹ", "PAR": "Paraguay", "AUS": "Úc", "TUR": "Thổ Nhĩ Kỳ",
  "GER": "Đức", "CUW": "Curacao", "CIV": "Bờ Biển Ngà", "ECU": "Ecuador",
  "NED": "Hà Lan", "JPN": "Nhật Bản", "SWE": "Thụy Điển", "TUN": "Tunisia",
  "BEL": "Bỉ", "EGY": "Ai Cập", "IRN": "Iran", "NZL": "New Zealand",
  "ESP": "Tây Ban Nha", "CPV": "Cabo Verde", "KSA": "Saudi Arabia", "URU": "Uruguay",
  "FRA": "Pháp", "SEN": "Senegal", "IRQ": "Iraq", "NOR": "Na Uy",
  "ARG": "Argentina", "AUT": "Áo", "JOR": "Jordan", "ALG": "Algeria",
  "POR": "Bồ Đào Nha", "COD": "CHDC Congo", "UZB": "Uzbekistan", "COL": "Colombia",
  "ENG": "Anh", "CRO": "Croatia", "GHA": "Ghana", "PAN": "Panama"
};

// Bản đồ các cặp đấu vòng bảng 1-72 (để tìm ID chính xác theo đội bóng)
const GROUP_STAGE_PAIRINGS = {
  "g1": ["MEX", "RSA"],
  "g2": ["KOR", "CZE"],
  "g3": ["CAN", "BIH"],
  "g4": ["USA", "PAR"],
  "g5": ["QAT", "SUI"],
  "g6": ["BRA", "MAR"],
  "g7": ["HAI", "SCO"],
  "g8": ["AUS", "TUR"],
  "g9": ["GER", "CUW"],
  "g10": ["NED", "JPN"],
  "g11": ["CIV", "ECU"],
  "g12": ["SWE", "TUN"],
  "g13": ["ESP", "CPV"],
  "g14": ["BEL", "EGY"],
  "g15": ["KSA", "URU"],
  "g16": ["IRN", "NZL"],
  "g17": ["FRA", "SEN"],
  "g18": ["IRQ", "NOR"],
  "g19": ["ARG", "ALG"],
  "g20": ["AUT", "JOR"],
  "g21": ["POR", "COD"],
  "g22": ["ENG", "CRO"],
  "g23": ["GHA", "PAN"],
  "g24": ["UZB", "COL"],
  "g25": ["CZE", "RSA"],
  "g26": ["SUI", "BIH"],
  "g27": ["CAN", "QAT"],
  "g28": ["MEX", "KOR"],
  "g29": ["USA", "AUS"],
  "g30": ["SCO", "MAR"],
  "g31": ["BRA", "HAI"],
  "g32": ["TUR", "PAR"],
  "g33": ["NED", "SWE"],
  "g34": ["GER", "CIV"],
  "g35": ["ECU", "CUW"],
  "g36": ["TUN", "JPN"],
  "g37": ["ESP", "KSA"],
  "g38": ["BEL", "IRN"],
  "g39": ["URU", "CPV"],
  "g40": ["NZL", "EGY"],
  "g41": ["ARG", "AUT"],
  "g42": ["FRA", "IRQ"],
  "g43": ["NOR", "SEN"],
  "g44": ["JOR", "ALG"],
  "g45": ["POR", "UZB"],
  "g46": ["ENG", "GHA"],
  "g47": ["PAN", "CRO"],
  "g48": ["COL", "COD"],
  "g49": ["BIH", "QAT"],
  "g50": ["SUI", "CAN"],
  "g51": ["MAR", "HAI"],
  "g52": ["SCO", "BRA"],
  "g53": ["RSA", "KOR"],
  "g54": ["CZE", "MEX"],
  "g55": ["CUW", "CIV"],
  "g56": ["ECU", "GER"],
  "g57": ["TUN", "NED"],
  "g58": ["JPN", "SWE"],
  "g59": ["TUR", "USA"],
  "g60": ["PAR", "AUS"],
  "g61": ["NOR", "FRA"],
  "g62": ["SEN", "IRQ"],
  "g63": ["CPV", "KSA"],
  "g64": ["URU", "ESP"],
  "g65": ["NZL", "BEL"],
  "g66": ["EGY", "IRN"],
  "g67": ["PAN", "ENG"],
  "g68": ["CRO", "GHA"],
  "g69": ["COL", "POR"],
  "g70": ["COD", "UZB"],
  "g71": ["ALG", "AUT"],
  "g72": ["JOR", "ARG"]
};

// ─────────────────────────────────────────────────────────────
//  HELPER: Lấy hoặc tạo mới một sheet theo tên
// ─────────────────────────────────────────────────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

// ─────────────────────────────────────────────────────────────
//  doGet — Đọc dữ liệu gửi về React
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  var params = e ? (e.parameter || {}) : {};

  // ── Gọi syncApi nếu yêu cầu đồng bộ tức thời từ Admin panel hoặc trigger ──
  if (params.action === "syncApi" || params.syncApi === "true") {
    try {
      // Xóa ETag cache để ép buộc tải lại và cập nhật sơ đồ ánh xạ mới
      var cache = CacheService.getScriptCache();
      cache.remove("zafronix_etag");
      cache.remove("zafronix_bracket_etag");
      
      syncZafronixToSheets();
    } catch (err) {
      Logger.log("Lỗi đồng bộ thủ công Zafronix: " + err.toString());
    }
  }

  // ── Nhánh verifyAccount: React gọi sau khi POST checkAccount ──
  if (params.action === "verifyAccount") {
    return handleVerifyAccount(params);
  }

  // --- CACHE HOÀN TOÀN CHO ĐỌC DỮ LIỆU ---
  var isCacheable = !params.action && params.syncApi !== "true";
  if (isCacheable) {
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get("wc_game_data");
    if (cachedData) {
      return ContentService.createTextOutput(cachedData)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // ── Nhánh mặc định: Trả toàn bộ dữ liệu game ──
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Đọc danh sách dự đoán (lấy bản ghi mới nhất của từng MA_USER)
  var predSheet = ss.getSheetByName("Predictions");
  var players = [];
  if (predSheet) {
    var data = predSheet.getDataRange().getValues();
    var latestUserPredictions = {};
    var seenUsers = {};

    // Duyệt ngược từ dòng cuối lên đầu để lấy bản ghi mới nhất lập tức, bỏ qua các bản ghi cũ của người chơi đó
    for (var i = data.length - 1; i >= 1; i--) {
      var maUser = (data[i][1] || "").toString().trim().toUpperCase();
      if (maUser && !seenUsers[maUser]) {
        seenUsers[maUser] = true;
        var timestamp = data[i][0];
        var ip        = data[i][2];
        var predJson  = data[i][3];
        if (predJson) {
          try {
            latestUserPredictions[maUser] = {
              id: maUser,
              predictions: JSON.parse(predJson),
              ip: ip,
              lastUpdated: new Date(timestamp).toISOString()
            };
          } catch (err) {}
        }
      }
    }

    players = Object.keys(latestUserPredictions).map(function(key) {
      return latestUserPredictions[key];
    });
  }

  // 2. Đọc kết quả trận đấu thực tế
  var matchSheet    = ss.getSheetByName("Matches");
  var matchesResults = {};
  if (matchSheet) {
    var mData = matchSheet.getDataRange().getValues();
    for (var j = 1; j < mData.length; j++) {
      var matchId = mData[j][0];
      var result  = mData[j][1];
      if (matchId) matchesResults[matchId] = result || null;
    }
  }

  // 3. Đọc thông tin đội knockout
  var koSheet      = ss.getSheetByName("KnockoutTeams");
  var knockoutTeams = {};
  if (koSheet) {
    var koData = koSheet.getDataRange().getValues();
    for (var k = 1; k < koData.length; k++) {
      var koMatchId = koData[k][0];
      if (koMatchId) {
        knockoutTeams[koMatchId] = {
          teamA:     koData[k][1] || "",
          teamB:     koData[k][2] || "",
          teamAName: koData[k][3] || "",
          teamBName: koData[k][4] || ""
        };
      }
    }
  }

  // 4. Đọc trạng thái khóa & cấu hình điểm phạt
  var lockSheet    = ss.getSheetByName("LockedMatches");
  var lockedMatches = {};
  if (lockSheet) {
    var lockData = lockSheet.getDataRange().getValues();
    for (var l = 1; l < lockData.length; l++) {
      var lockMatchId = lockData[l][0];
      var val         = lockData[l][1];
      if (lockMatchId) {
        if      (val === "true"  || val === true)  lockedMatches[lockMatchId] = true;
        else if (val === "false" || val === false) lockedMatches[lockMatchId] = false;
        else                                       lockedMatches[lockMatchId] = val;
      }
    }
  }

  // 5. Đọc chi tiết trận đấu (thời tiết, trọng tài, bàn thắng, thẻ phạt...)
  var detailsSheet = ss.getSheetByName("MatchesDetails");
  var matchesDetails = {};
  if (detailsSheet) {
    var dData = detailsSheet.getDataRange().getValues();
    for (var d = 1; d < dData.length; d++) {
      var mId = dData[d][0];
      var detailsJson = dData[d][1];
      if (mId && detailsJson) {
        try {
          matchesDetails[mId] = JSON.parse(detailsJson);
        } catch(e) {}
      }
    }
  }

  var output = {
    players:        players,
    matchesResults: matchesResults,
    knockoutTeams:  knockoutTeams,
    lockedMatches:  lockedMatches,
    matchesDetails: matchesDetails
  };

  var outputStr = JSON.stringify(output);
  if (isCacheable) {
    var cache = CacheService.getScriptCache();
    try {
      cache.put("wc_game_data", outputStr, 600); // Lưu cache trong 10 phút
    } catch(err) {}
  }

  return ContentService
    .createTextOutput(outputStr)
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
//  handleVerifyAccount — Kiểm tra kết quả đăng nhập (GET)
// ─────────────────────────────────────────────────────────────
function handleVerifyAccount(params) {
  var maUser   = (params.ma_user   || "").trim().toUpperCase();
  var password = (params.password  || "").trim();

  if (!maUser || !password) {
    return jsonResponse({ success: false, error: "Thiếu thông tin đăng nhập!" });
  }

  var ss           = SpreadsheetApp.getActiveSpreadsheet();
  var accountSheet = getOrCreateSheet(ss, "Accounts", ["MA_USER", "PASSWORD", "CREATED_AT", "LAST_LOGIN"]);
  var accData      = accountSheet.getDataRange().getValues();

  for (var i = 1; i < accData.length; i++) {
    if (String(accData[i][0]).trim().toUpperCase() === maUser) {
      var storedPwd = String(accData[i][1]).trim();
      if (storedPwd === password) {
        accountSheet.getRange(i + 1, 4).setValue(new Date().toISOString());
        return jsonResponse({ success: true, isFirstTime: false });
      } else {
        return jsonResponse({ success: false, error: "Mật khẩu không đúng. Vui lòng thử lại!" });
      }
    }
  }

  return jsonResponse({ success: false, error: "Tài khoản chưa được đăng ký. Vui lòng thử lại!" });
}

// ─────────────────────────────────────────────────────────────
//  doPost — Nhận dữ liệu từ React
// ─────────────────────────────────────────────────────────────
function doPost(e) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var payload;

  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ status: "error", message: "Invalid JSON" });
  }

  var action = payload.action;

  if (action === "checkAccount") {
    return handleCheckAccount(ss, payload);
  }

  if (action === "submitPrediction") {
    var predSheet = getOrCreateSheet(ss, "Predictions", ["Timestamp", "MA_USER", "IP", "Predictions_JSON"]);
    predSheet.appendRow([
      payload.timestamp || new Date().toISOString(),
      payload.ma_user,
      payload.ip,
      JSON.stringify(payload.predictions)
    ]);
  }

  else if (action === "updateResults") {
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
        var t = payload.knockoutTeams[key];
        koSheet.appendRow([key, t.teamA, t.teamB, t.teamAName, t.teamBName]);
      });
    }

    var detailsSheet = ss.getSheetByName("MatchesDetails");
    if (detailsSheet) {
      detailsSheet.clear();
      detailsSheet.appendRow(["Match_Id", "Details_JSON"]);
    }
  }

  else if (action === "updateLocks") {
    var lockSheet = ss.getSheetByName("LockedMatches");
    if (lockSheet) {
      lockSheet.clear();
      lockSheet.appendRow(["Match_Id", "Is_Locked"]);
      Object.keys(payload.lockedMatches).forEach(function(key) {
        lockSheet.appendRow([key, payload.lockedMatches[key]]);
      });
    }
  }

  if (action === "submitPrediction" || action === "updateResults" || action === "updateLocks") {
    clearGameDataCache();
  }

  return jsonResponse({ status: "success" });
}

function handleCheckAccount(ss, payload) {
  var maUser   = (payload.ma_user  || "").trim().toUpperCase();
  var password = (payload.password || "").trim();
  var ip        = payload.ip        || "";
  var timestamp = payload.timestamp || new Date().toISOString();

  if (!maUser || !password) {
    return jsonResponse({ status: "error", message: "Thiếu ma_user hoặc password!" });
  }

  var accountSheet = getOrCreateSheet(ss, "Accounts", ["MA_USER", "PASSWORD", "CREATED_AT", "LAST_LOGIN"]);
  var accData      = accountSheet.getDataRange().getValues();

  for (var i = 1; i < accData.length; i++) {
    if (String(accData[i][0]).trim().toUpperCase() === maUser) {
      return jsonResponse({ status: "exists" });
    }
  }

  accountSheet.appendRow([maUser, password, timestamp, timestamp]);
  return jsonResponse({ status: "registered" });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
//  ZAFRONIX SYNC FUNCTIONS (Đồng bộ từ Zafronix API)
// ─────────────────────────────────────────────────────────────

function fetchMatchesFromZafronix() {
  var cache = CacheService.getScriptCache();
  var cachedEtag = cache.get("zafronix_etag");
  var keyIndex = parseInt(PropertiesService.getScriptProperties().getProperty("LAST_KEY_INDEX") || "0", 10);
  
  for (var attempt = 0; attempt < ZAFRONIX_API_KEYS.length; attempt++) {
    var activeIndex = (keyIndex + attempt) % ZAFRONIX_API_KEYS.length;
    var currentKey = ZAFRONIX_API_KEYS[activeIndex];
    
    var headers = {
      "X-API-Key": currentKey
    };
    if (cachedEtag) {
      headers["If-None-Match"] = cachedEtag;
    }
    
    var options = {
      "headers": headers,
      "muteHttpExceptions": true
    };
    
    try {
      var url = "https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026";
      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();
      
      if (code === 304) {
        Logger.log("304 Not Modified (Không tốn quota API) dùng Key chỉ số: " + activeIndex);
        PropertiesService.getScriptProperties().setProperty("LAST_KEY_INDEX", activeIndex.toString());
        return { status: 304 };
      }
      
      if (code === 200) {
        Logger.log("200 OK (Cập nhật dữ liệu mới) dùng Key chỉ số: " + activeIndex);
        PropertiesService.getScriptProperties().setProperty("LAST_KEY_INDEX", activeIndex.toString());
        
        var etag = response.getHeaders()["ETag"] || response.getHeaders()["etag"];
        if (etag) {
          cache.put("zafronix_etag", etag, 21600);
        }
        
        return { status: 200, data: JSON.parse(response.getContentText()).data };
      }
      
      if (code === 429) {
        Logger.log("Key chỉ số " + activeIndex + " bị hết hạn mức (429). Đang thử key tiếp theo...");
        continue;
      }
      
      Logger.log("Key chỉ số " + activeIndex + " trả về lỗi khác: " + code);
    } catch (e) {
      Logger.log("Lỗi kết nối trên Key chỉ số " + activeIndex + ": " + e.toString());
    }
  }
  
  throw new Error("Tất cả các API Keys đều đã hết hạn mức hoặc lỗi!");
}

function fetchBracketFromZafronix() {
  var cache = CacheService.getScriptCache();
  var cachedEtag = cache.get("zafronix_bracket_etag");
  var keyIndex = parseInt(PropertiesService.getScriptProperties().getProperty("LAST_KEY_INDEX") || "0", 10);
  
  for (var attempt = 0; attempt < ZAFRONIX_API_KEYS.length; attempt++) {
    var activeIndex = (keyIndex + attempt) % ZAFRONIX_API_KEYS.length;
    var currentKey = ZAFRONIX_API_KEYS[activeIndex];
    
    var headers = {
      "X-API-Key": currentKey
    };
    if (cachedEtag) {
      headers["If-None-Match"] = cachedEtag;
    }
    
    var options = {
      "headers": headers,
      "muteHttpExceptions": true
    };
    
    try {
      var url = "https://api.zafronix.com/fifa/worldcup/v1/bracket?year=2026";
      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();
      
      if (code === 304) {
        Logger.log("Bracket 304 Not Modified");
        PropertiesService.getScriptProperties().setProperty("LAST_KEY_INDEX", activeIndex.toString());
        return { status: 304 };
      }
      
      if (code === 200) {
        Logger.log("Bracket 200 OK");
        PropertiesService.getScriptProperties().setProperty("LAST_KEY_INDEX", activeIndex.toString());
        
        var etag = response.getHeaders()["ETag"] || response.getHeaders()["etag"];
        if (etag) {
          cache.put("zafronix_bracket_etag", etag, 21600);
        }
        
        return { status: 200, stages: JSON.parse(response.getContentText()).stages };
      }
      
      if (code === 429) continue;
    } catch (e) {
      Logger.log("Lỗi fetch bracket: " + e.toString());
    }
  }
  return { status: 500 };
}

function fetchMatchesFromZafronixRaw() {
  var keyIndex = parseInt(PropertiesService.getScriptProperties().getProperty("LAST_KEY_INDEX") || "0", 10);
  for (var attempt = 0; attempt < ZAFRONIX_API_KEYS.length; attempt++) {
    var activeIndex = (keyIndex + attempt) % ZAFRONIX_API_KEYS.length;
    var currentKey = ZAFRONIX_API_KEYS[activeIndex];
    var options = {
      "headers": { "X-API-Key": currentKey },
      "muteHttpExceptions": true
    };
    try {
      var url = "https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026";
      var response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        return JSON.parse(response.getContentText()).data;
      }
    } catch (e) {}
  }
  return null;
}

function fetchBracketFromZafronixRaw() {
  var keyIndex = parseInt(PropertiesService.getScriptProperties().getProperty("LAST_KEY_INDEX") || "0", 10);
  for (var attempt = 0; attempt < ZAFRONIX_API_KEYS.length; attempt++) {
    var activeIndex = (keyIndex + attempt) % ZAFRONIX_API_KEYS.length;
    var currentKey = ZAFRONIX_API_KEYS[activeIndex];
    var options = {
      "headers": { "X-API-Key": currentKey },
      "muteHttpExceptions": true
    };
    try {
      var url = "https://api.zafronix.com/fifa/worldcup/v1/bracket?year=2026";
      var response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        return JSON.parse(response.getContentText()).stages;
      }
    } catch (e) {}
  }
  return null;
}

function cleanScorerName(name) {
  if (!name) return "";
  return name.replace(/\s+\d+(?:\+\d+)?'?\s*(og|o\.g|pen|penalty)\b/gi, '').trim();
}

function mapZafronixIdToLocalId(match) {
  var matchNo = parseInt(match.id.split("-")[1], 10);
  if (matchNo >= 1 && matchNo <= 72) {
    var teamA_code = TEAM_NAME_TO_CODE[(match.homeTeam || "").toLowerCase().trim()] || match.homeTeam || "";
    var teamB_code = TEAM_NAME_TO_CODE[(match.awayTeam || "").toLowerCase().trim()] || match.awayTeam || "";
    
    for (var key in GROUP_STAGE_PAIRINGS) {
      var pair = GROUP_STAGE_PAIRINGS[key];
      if ((pair[0] === teamA_code && pair[1] === teamB_code) ||
          (pair[0] === teamB_code && pair[1] === teamA_code)) {
        return key;
      }
    }
    return null;
  } else if (matchNo >= 73 && matchNo <= 88) {
    return "r32_" + (matchNo - 72);
  } else if (matchNo >= 89 && matchNo <= 96) {
    return "r16_" + (matchNo - 88);
  } else if (matchNo >= 97 && matchNo <= 100) {
    return "qf_" + (matchNo - 96);
  } else if (matchNo >= 101 && matchNo <= 102) {
    return "sf_" + (matchNo - 100);
  } else if (matchNo === 103) {
    return "third_place";
  } else if (matchNo === 104) {
    return "final";
  }
  return null;
}

// Bản đồ thông tin mặc định (placeholders) vòng Knockout
const DEFAULT_KNOCKOUT_TEAMS = {
  "r32_1": { teamA: "1_1", teamB: "2_1", teamAName: "Á quân Bảng A", teamBName: "Á quân Bảng B" },
  "r32_4": { teamA: "1_4", teamB: "2_4", teamAName: "Nhất Bảng C", teamBName: "Á quân Bảng F" },
  "r32_2": { teamA: "1_2", teamB: "2_2", teamAName: "Nhất Bảng E", teamBName: "Hạng 3 A/B/C/D/F" },
  "r32_3": { teamA: "1_3", teamB: "2_3", teamAName: "Nhất Bảng F", teamBName: "Á quân Bảng C" },
  "r32_6": { teamA: "1_6", teamB: "2_6", teamAName: "Á quân Bảng E", teamBName: "Á quân Bảng I" },
  "r32_5": { teamA: "1_5", teamB: "2_5", teamAName: "Nhất Bảng I", teamBName: "Hạng 3 C/D/F/G/H" },
  "r32_7": { teamA: "1_7", teamB: "2_7", teamAName: "Nhất Bảng A", teamBName: "Hạng 3 C/E/F/H/I" },
  "r32_8": { teamA: "1_8", teamB: "2_8", teamAName: "Nhất Bảng L", teamBName: "Hạng 3 E/H/I/J/K" },
  "r32_11": { teamA: "1_11", teamB: "2_11", teamAName: "Nhất Bảng G", teamBName: "Hạng 3 A/E/H/I/J" },
  "r32_10": { teamA: "1_10", teamB: "2_10", teamAName: "Nhất Bảng D", teamBName: "Hạng 3 B/E/F/I/J" },
  "r32_12": { teamA: "1_12", teamB: "2_12", teamAName: "Nhất Bảng H", teamBName: "Á quân Bảng J" },
  "r32_9": { teamA: "1_9", teamB: "2_9", teamAName: "Á quân Bảng K", teamBName: "Á quân Bảng L" },
  "r32_13": { teamA: "1_13", teamB: "2_13", teamAName: "Nhất Bảng B", teamBName: "Hạng 3 E/F/G/I/J" },
  "r32_16": { teamA: "1_16", teamB: "2_16", teamAName: "Á quân Bảng D", teamBName: "Á quân Bảng G" },
  "r32_14": { teamA: "1_14", teamB: "2_14", teamAName: "Nhất Bảng J", teamBName: "Á quân Bảng H" },
  "r32_15": { teamA: "1_15", teamB: "2_15", teamAName: "Nhất Bảng K", teamBName: "Hạng 3 D/E/I/J/L" },
  "r16_2": { teamA: "W32_3", teamB: "W32_4", teamAName: "Thắng 73", teamBName: "Thắng 75" },
  "r16_1": { teamA: "W32_1", teamB: "W32_2", teamAName: "Thắng 74", teamBName: "Thắng 77" },
  "r16_3": { teamA: "W32_5", teamB: "W32_6", teamAName: "Thắng 76", teamBName: "Thắng 78" },
  "r16_4": { teamA: "W32_7", teamB: "W32_8", teamAName: "Thắng 79", teamBName: "Thắng 80" },
  "r16_5": { teamA: "W32_9", teamB: "W32_10", teamAName: "Thắng 83", teamBName: "Thắng 84" },
  "r16_6": { teamA: "W32_11", teamB: "W32_12", teamAName: "Thắng 81", teamBName: "Thắng 82" },
  "r16_7": { teamA: "W32_13", teamB: "W32_14", teamAName: "Thắng 86", teamBName: "Thắng 88" },
  "r16_8": { teamA: "W32_15", teamB: "W32_16", teamAName: "Thắng 85", teamBName: "Thắng 87" },
  "qf_1": { teamA: "W16_1", teamB: "W16_2", teamAName: "Thắng 89", teamBName: "Thắng 90" },
  "qf_2": { teamA: "W16_3", teamB: "W16_4", teamAName: "Thắng 93", teamBName: "Thắng 94" },
  "qf_3": { teamA: "W16_5", teamB: "W16_6", teamAName: "Thắng 91", teamBName: "Thắng 92" },
  "qf_4": { teamA: "W16_7", teamB: "W16_8", teamAName: "Thắng 95", teamBName: "Thắng 96" },
  "sf_1": { teamA: "WQF_1", teamB: "WQF_2", teamAName: "Thắng 97", teamBName: "Thắng 98" },
  "sf_2": { teamA: "WQF_3", teamB: "WQF_4", teamAName: "Thắng 99", teamBName: "Thắng 100" },
  "third_place": { teamA: "LSF_1", teamB: "LSF_2", teamAName: "Thua 101", teamBName: "Thua 102" },
  "final": { teamA: "WSF_1", teamB: "WSF_2", teamAName: "Thắng 101", teamBName: "Thắng 102" }
};

function syncZafronixToSheets() {
  var apiResult = fetchMatchesFromZafronix();
  var bracketResult = fetchBracketFromZafronix();
  
  // Nếu cả hai đều không đổi thì dừng
  if (apiResult.status === 304 && (!bracketResult || bracketResult.status === 304)) {
    return; 
  }
  
  var matches = apiResult.status === 200 ? apiResult.data : fetchMatchesFromZafronixRaw();
  var stages = (bracketResult && bracketResult.status === 200) ? bracketResult.stages : fetchBracketFromZafronixRaw();
  
  if (!matches || !Array.isArray(matches) || !stages) return;
  
  // Dựng bản đồ trận đấu từ Bracket API để tra cứu winner vòng knockout
  var bracketMatches = {};
  for (var stageKey in stages) {
    var stageList = stages[stageKey];
    if (stageList && Array.isArray(stageList)) {
      stageList.forEach(function(bm) {
        bracketMatches[bm.matchId] = bm;
      });
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Chuẩn bị bảng Matches
  var matchSheet = ss.getSheetByName("Matches");
  if (!matchSheet) return;
  var matchData = matchSheet.getDataRange().getValues();
  var matchRows = {};
  for (var i = 1; i < matchData.length; i++) {
    var matchId = matchData[i][0];
    if (matchId) matchRows[matchId] = i + 1;
  }
  
  // 2. Chuẩn bị bảng KnockoutTeams
  var koSheet = ss.getSheetByName("KnockoutTeams");
  if (!koSheet) return;
  var koData = koSheet.getDataRange().getValues();
  var koRows = {};
  for (var k = 1; k < koData.length; k++) {
    var koId = koData[k][0];
    if (koId) koRows[koId] = k + 1;
  }
  
  // 3. Chuẩn bị bảng LockedMatches
  var lockSheet = ss.getSheetByName("LockedMatches");
  if (!lockSheet) return;
  var lockData = lockSheet.getDataRange().getValues();
  var lockRows = {};
  for (var l = 1; l < lockData.length; l++) {
    var lockKey = lockData[l][0];
    if (lockKey) lockRows[lockKey] = l + 1;
  }
  
  // Đọc danh sách tỉ số hiện có
  var scoresObj = {};
  if (lockRows["MATCHES_SCORES"]) {
    try {
      var existingScoresStr = lockData[lockRows["MATCHES_SCORES"] - 1][1];
      if (existingScoresStr) {
        scoresObj = JSON.parse(existingScoresStr);
      }
    } catch(e) {}
  }

  // 4. Chuẩn bị bảng MatchesDetails
  var detailsSheet = getOrCreateSheet(ss, "MatchesDetails", ["Match_Id", "Details_JSON"]);
  var detailsData = detailsSheet.getDataRange().getValues();
  var detailsRows = {};
  for (var d = 1; d < detailsData.length; d++) {
    var detId = detailsData[d][0];
    if (detId) detailsRows[detId] = d + 1;
  }
  
  var hasChanges = false;
  
  matches.forEach(function(match) {
    var localId = mapZafronixIdToLocalId(match);
    if (!localId) return;
    
    var matchNo = parseInt(match.id.split("-")[1], 10);
    // Tối ưu hóa: Bỏ qua các trận vòng bảng (g1 -> g72) đã có tỉ số trong sheet.
    // Vì vòng bảng đã kết thúc, các tỉ số này là cố định và không thay đổi.
    if (matchNo <= 72 && scoresObj[localId]) {
      return;
    }
    
    var bMatch = bracketMatches[match.id]; // Tìm thông tin tương ứng bên bracket
    
    // Sửa lỗi hoán đổi đối thủ vòng 32 của Đức và Pháp (Đức vs Paraguay, Pháp vs Thụy Điển) từ API
    if (match.id === "2026-074") {
      var awayVal = (match.awayTeam || (bMatch && bMatch.away) || "").toLowerCase().trim();
      if (awayVal === "sweden" || awayVal === "thụy điển") {
        match.awayTeam = "Paraguay";
        if (bMatch) bMatch.away = "Paraguay";
      }
    } else if (match.id === "2026-077") {
      var awayVal = (match.awayTeam || (bMatch && bMatch.away) || "").toLowerCase().trim();
      if (awayVal === "paraguay") {
        match.awayTeam = "Sweden";
        if (bMatch) bMatch.away = "Sweden";
      }
    }
    
    // Tìm mã code của hai đội
    var teamA_code, teamB_code;
    if (matchNo <= 72) {
      var pair = GROUP_STAGE_PAIRINGS[localId];
      if (pair) {
        var apiHomeCode = TEAM_NAME_TO_CODE[(match.homeTeam || "").toLowerCase().trim()] || match.homeTeam || "";
        if (apiHomeCode === pair[0]) {
          teamA_code = pair[0];
          teamB_code = pair[1];
        } else if (apiHomeCode === pair[1]) {
          teamA_code = pair[1];
          teamB_code = pair[0];
        } else {
          teamA_code = pair[0];
          teamB_code = pair[1];
        }
      } else {
        teamA_code = TEAM_NAME_TO_CODE[(match.homeTeam || "").toLowerCase().trim()] || match.homeTeam || "";
        teamB_code = TEAM_NAME_TO_CODE[(match.awayTeam || "").toLowerCase().trim()] || match.awayTeam || "";
      }
    } else {
      var homeTeamName = (bMatch && bMatch.home) ? bMatch.home : (match.homeTeam || "");
      var awayTeamName = (bMatch && bMatch.away) ? bMatch.away : (match.awayTeam || "");
      
      teamA_code = TEAM_NAME_TO_CODE[homeTeamName.toLowerCase().trim()] || homeTeamName || "";
      teamB_code = TEAM_NAME_TO_CODE[awayTeamName.toLowerCase().trim()] || awayTeamName || "";
    }

    // A. XỬ LÝ TỈ SỐ & KẾT QUẢ DỰ ĐOÁN
    if (match.homeScore !== null && match.awayScore !== null) {
      var homeScore = parseInt(match.homeScore);
      var awayScore = parseInt(match.awayScore);
      var scoreStr = homeScore + " - " + awayScore;
      
      var pen = match.penalties || match.penaltyShootout;
      var penHome = pen ? (pen.home !== undefined && pen.home !== null ? pen.home : pen.homeScore) : null;
      var penAway = pen ? (pen.away !== undefined && pen.away !== null ? pen.away : pen.awayScore) : null;
      var hasPen = penHome !== undefined && penHome !== null && penHome !== "";
      
      // Hiển thị hiệp phụ nếu trận đấu kéo dài sang hiệp phụ và không đá luân lưu
      if (match.extraTime) {
        if (!hasPen) {
          scoreStr += " (Hiệp phụ)";
        }
      }
      
      if (hasPen) {
        scoreStr += " (Pen " + penHome + " - " + penAway + ")";
      }
      
      if (scoresObj[localId] !== scoreStr) {
        scoresObj[localId] = scoreStr;
        hasChanges = true;
      }
      
      var resultVal = null;
      if (matchNo <= 72) {
        if (homeScore > awayScore) {
          resultVal = "A";
        } else if (homeScore < awayScore) {
          resultVal = "B";
        } else {
          resultVal = "D"; 
        }
      } else {
        // Vòng loại trực tiếp: tính kết quả dự đoán trong 90 phút chính thức
        var endedInDraw90 = match.extraTime || hasPen || (homeScore === awayScore);
        if (endedInDraw90) {
          resultVal = "D"; // Kết quả trong 90 phút là Hòa
        } else {
          if (homeScore > awayScore) {
            resultVal = "A";
          } else {
            resultVal = "B";
          }
        }
      }
      
      if (matchRows[localId]) {
        var r = matchRows[localId];
        if (matchData[r - 1][1] !== resultVal) {
          matchSheet.getRange(r, 2).setValue(resultVal || "");
          hasChanges = true;
        }
      } else {
        matchSheet.appendRow([localId, resultVal || ""]);
        hasChanges = true;
      }
    }
    
    // B. XỬ LÝ ĐỘI BÓNG VÒNG KNOCKOUT (Match 73 -> 104)
    if (matchNo >= 73) {
      var defaultMatch = DEFAULT_KNOCKOUT_TEAMS[localId] || {};
      
      var existingTeamA = koRows[localId] ? koData[koRows[localId] - 1][1] : "";
      var existingTeamB = koRows[localId] ? koData[koRows[localId] - 1][2] : "";
      var existingTeamAName = koRows[localId] ? koData[koRows[localId] - 1][3] : "";
      var existingTeamBName = koRows[localId] ? koData[koRows[localId] - 1][4] : "";

      var homeTeamName = (bMatch && bMatch.home) ? bMatch.home : (match.homeTeam || "");
      var awayTeamName = (bMatch && bMatch.away) ? bMatch.away : (match.awayTeam || "");

      var teamA_name = TEAM_CODE_TO_VN[teamA_code] || homeTeamName || "";
      var teamB_name = TEAM_CODE_TO_VN[teamB_code] || awayTeamName || "";

      // Giữ lại dữ liệu hiện có trong sheet hoặc dùng mặc định nếu API trả về trống (chưa đấu xong vòng bảng)
      var finalTeamA = teamA_code || existingTeamA || defaultMatch.teamA || "";
      var finalTeamB = teamB_code || existingTeamB || defaultMatch.teamB || "";
      var finalTeamAName = teamA_name || existingTeamAName || defaultMatch.teamAName || "";
      var finalTeamBName = teamB_name || existingTeamBName || defaultMatch.teamBName || "";
      
      if (koRows[localId]) {
        var kr = koRows[localId];
        if (koData[kr - 1][1] !== finalTeamA || koData[kr - 1][2] !== finalTeamB || 
            koData[kr - 1][3] !== finalTeamAName || koData[kr - 1][4] !== finalTeamBName) {
          koSheet.getRange(kr, 2, 1, 4).setValues([[finalTeamA, finalTeamB, finalTeamAName, finalTeamBName]]);
          hasChanges = true;
        }
      } else {
        koSheet.appendRow([localId, finalTeamA, finalTeamB, finalTeamAName, finalTeamBName]);
        hasChanges = true;
      }
    }

    // C. XỬ LÝ CHI TIẾT TRẬN ĐẤU (THỜI TIẾT, TRỌNG TÀI, BÀN THẮNG, THẺ PHẠT...)
    var cleanGoals = (match.goals || [])
      .map(function(g) {
        var team = g.team;
        if (team === 'home') team = teamA_code;
        else if (team === 'away') team = teamB_code;
        else {
          var code = TEAM_NAME_TO_CODE[(team || "").toLowerCase().trim()];
          if (code) team = code;
        }
        return {
          minute: g.minute,
          scorer: cleanScorerName(g.scorer),
          assist: g.assist ? cleanScorerName(g.assist) : null,
          type: g.type || null,
          team: team
        };
      });

    var cleanCards = (match.cards || [])
      .map(function(c) {
        var team = c.team;
        if (team === 'home') team = teamA_code;
        else if (team === 'away') team = teamB_code;
        else {
          var code = TEAM_NAME_TO_CODE[(team || "").toLowerCase().trim()];
          if (code) team = code;
        }
        return {
          minute: c.minute,
          player: cleanScorerName(c.player),
          color: c.color,
          team: team
        };
      });

    var cleanSubs = (match.substitutions || [])
      .map(function(s) {
        var team = s.team;
        if (team === 'home') team = teamA_code;
        else if (team === 'away') team = teamB_code;
        else {
          var code = TEAM_NAME_TO_CODE[(team || "").toLowerCase().trim()];
          if (code) team = code;
        }
        return {
          minute: s.minute,
          player: cleanScorerName(s.player),
          info: s.info ? { name: cleanScorerName(s.info.name || s.info) } : null,
          team: team
        };
      });

    var winnerCode = null;
    if (matchNo > 72) {
      if (bMatch && bMatch.winner) {
        winnerCode = TEAM_NAME_TO_CODE[(bMatch.winner || "").toLowerCase().trim()] || bMatch.winner || null;
      } else {
        var pen = match.penalties || match.penaltyShootout;
        if (pen && pen.homeScore !== undefined && pen.homeScore !== null) {
          winnerCode = (parseInt(pen.homeScore) > parseInt(pen.awayScore)) ? teamA_code : teamB_code;
        } else if (match.homeScore !== null && match.awayScore !== null) {
          var hScore = parseInt(match.homeScore);
          var aScore = parseInt(match.awayScore);
          winnerCode = (hScore > aScore) ? teamA_code : (hScore < aScore ? teamB_code : null);
        }
      }
    }

    var detailsObj = {
      goals: cleanGoals,
      cards: cleanCards,
      substitutions: cleanSubs,
      referee: match.referee || null,
      weather: match.weather || null,
      captains: match.captains || null,
      penalties: match.penalties || match.penaltyShootout || null,
      extraTime: match.extraTime || false,
      winner: winnerCode
    };
    var detailsJsonStr = JSON.stringify(detailsObj);
    
    if (detailsRows[localId]) {
      var dr = detailsRows[localId];
      if (detailsData[dr - 1][1] !== detailsJsonStr) {
        detailsSheet.getRange(dr, 2).setValue(detailsJsonStr);
        hasChanges = true;
      }
    } else {
      detailsSheet.appendRow([localId, detailsJsonStr]);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    var scoresStr = JSON.stringify(scoresObj);
    if (lockRows["MATCHES_SCORES"]) {
      lockSheet.getRange(lockRows["MATCHES_SCORES"], 2).setValue(scoresStr);
    } else {
      lockSheet.appendRow(["MATCHES_SCORES", scoresStr]);
    }
    
    var syncTimeStr = new Date().toISOString();
    if (lockRows["LAST_API_SYNC_TIME"]) {
      lockSheet.getRange(lockRows["LAST_API_SYNC_TIME"], 2).setValue(syncTimeStr);
    } else {
      lockSheet.appendRow(["LAST_API_SYNC_TIME", syncTimeStr]);
    }
    
    Logger.log("Đã đồng bộ kết quả mới thành công!");
  } else {
    Logger.log("Dữ liệu không có thay đổi gì mới.");
  }
}

// Xóa cache dữ liệu game
function clearGameDataCache() {
  var cache = CacheService.getScriptCache();
  try {
    cache.remove("wc_game_data");
  } catch(e) {}
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
