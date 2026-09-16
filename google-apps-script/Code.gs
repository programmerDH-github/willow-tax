/**
 * 세무회계 버들 - 상담 신청 폼 연동 스크립트
 *
 * 사용법:
 * 1. 새 구글 스프레드시트를 만든다.
 * 2. 확장 프로그램 > Apps Script 클릭 후, 이 파일 내용 전체를 붙여넣는다.
 * 3. 함수 선택 드롭다운에서 setupSheet 선택 후 "실행" (최초 1회, 권한 승인 필요).
 * 4. 함수 선택 드롭다운에서 setupDashboard 선택 후 "실행" (시트1 → 현황판으로 자동 변환).
 * 5. 배포 > 새 배포 > 유형: 웹앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 *    배포 후 나오는 웹앱 URL을 홈페이지 쪽에 연결한다.
 */

const SHEET_NAME = "상담신청";

const HEADERS = [
  "접수일시",
  "이름",
  "연락처",
  "카테고리",
  "사업자구분",
  "연락가능시간",
  "희망상담일",
  "문의내용",
  "상담상태",
  "입금여부",
  "수수료",
];

const STATUS_OPTIONS = ["접수", "연락완료", "상담완료"];
const PAYMENT_OPTIONS = ["미입금", "입금완료", "미진행"];

// 최초 1회 실행: 헤더, 드롭다운, 조건부 서식, 필터 뷰 세팅
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // 기본으로 생성되는 "시트1" 등은 남겨두고, 이 시트를 맨 앞으로 이동
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);

  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#38532f")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, HEADERS.length, 140);
  sheet.setColumnWidth(8, 260); // 문의내용 넓게

  const statusCol = HEADERS.indexOf("상담상태") + 1;
  const paymentCol = HEADERS.indexOf("입금여부") + 1;
  const feeCol = HEADERS.indexOf("수수료") + 1;
  const maxRows = 500;

  sheet.setColumnWidth(feeCol, 110);
  sheet.getRange(2, feeCol, maxRows, 1).setNumberFormat("#,##0\"원\"");

  // 드롭다운 (데이터 유효성 검사)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, maxRows, 1).setDataValidation(statusRule);

  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PAYMENT_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, paymentCol, maxRows, 1).setDataValidation(paymentRule);

  // 조건부 서식
  const rules = [];
  const statusRange = sheet.getRange(2, statusCol, maxRows, 1);
  const paymentRange = sheet.getRange(2, paymentCol, maxRows, 1);

  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("접수")
      .setBackground("#fff3c4")
      .setRanges([statusRange])
      .build()
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("연락완료")
      .setBackground("#cfe3fb")
      .setRanges([statusRange])
      .build()
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("상담완료")
      .setBackground("#e4e2da")
      .setRanges([statusRange])
      .build()
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("미입금")
      .setBackground("#fbd4cf")
      .setFontColor("#a12b1f")
      .setBold(true)
      .setRanges([paymentRange])
      .build()
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("입금완료")
      .setBackground("#d6efce")
      .setFontColor("#2c5e1a")
      .setRanges([paymentRange])
      .build()
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("미진행")
      .setBackground("#e4e2da")
      .setFontColor("#6f7268")
      .setRanges([paymentRange])
      .build()
  );
  sheet.setConditionalFormatRules(rules);

  Logger.log("세팅 완료! '상담신청' 시트를 확인하세요.");
}

const DASHBOARD_SHEET_NAME = "현황판";

// 미완료 상담만 실시간으로 모아 보여주는 대시보드 시트 세팅 (최초 1회 실행)
function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheetByName("시트1");
    if (sheet) {
      sheet.setName(DASHBOARD_SHEET_NAME);
    } else {
      sheet = ss.insertSheet(DASHBOARD_SHEET_NAME);
    }
  }

  sheet.clear();
  sheet.clearConditionalFormatRules();
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);

  // 제목
  sheet.getRange("A1:G1").merge();
  sheet.getRange("A1")
    .setValue("🔔 미완료 상담 현황")
    .setFontSize(20)
    .setFontWeight("bold")
    .setBackground("#38532f")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
  sheet.setRowHeight(1, 44);

  // 실시간 카운트 (상담 미완료 또는 입금 미완료 기준)
  sheet.getRange("A2:G2").merge();
  sheet.getRange("A2").setFormula(
    `="현재 처리 대기 중인 상담: " & IFERROR(COUNTA(QUERY(${SHEET_NAME}!A2:K,"select A where I <> '상담완료' or J = '미입금'",0)),0) & "건"`
  );
  sheet.getRange("A2")
    .setFontSize(13)
    .setFontWeight("bold")
    .setFontColor("#38532f")
    .setHorizontalAlignment("center");
  sheet.setRowHeight(2, 30);

  // 수수료 합계 (왼쪽: 받은 금액 / 오른쪽: 아직 받아야 할 금액)
  sheet.getRange("A3:C3").merge();
  sheet.getRange("A3").setFormula(
    `="💰 받은 금액: " & TEXT(SUMIF(${SHEET_NAME}!J2:J,"입금완료",${SHEET_NAME}!K2:K),"#,##0") & "원"`
  );
  sheet.getRange("A3")
    .setFontSize(16)
    .setFontWeight("bold")
    .setBackground("#d6efce")
    .setFontColor("#2c5e1a")
    .setHorizontalAlignment("center");

  sheet.getRange("E3:G3").merge();
  sheet.getRange("E3").setFormula(
    `="⏳ 받아야 할 금액: " & TEXT(SUMIF(${SHEET_NAME}!J2:J,"미입금",${SHEET_NAME}!K2:K),"#,##0") & "원"`
  );
  sheet.getRange("E3")
    .setFontSize(16)
    .setFontWeight("bold")
    .setBackground("#fbd4cf")
    .setFontColor("#a12b1f")
    .setHorizontalAlignment("center");
  sheet.setRowHeight(3, 40);

  // 미완료 상담 목록 (상담 미완료 또는 입금 미완료인 건만, 상담신청 시트에서 실시간 필터링)
  sheet.getRange("A5").setFormula(
    `=QUERY(${SHEET_NAME}!A2:K,"select A,B,C,D,I,J,K where I <> '상담완료' or J = '미입금' order by A desc label A '접수일시', B '이름', C '연락처', D '카테고리', I '상담상태', J '입금여부', K '수수료'",0)`
  );
  sheet.getRange("A5:G5").setFontWeight("bold").setBackground("#e2efde");
  sheet.setFrozenRows(5);
  sheet.setColumnWidths(1, 7, 150);
  sheet.setColumnWidth(3, 130);
  sheet.getRange("G6:G300").setNumberFormat("#,##0\"원\"");

  // 조건부 서식 (상담신청 시트와 동일한 색상 규칙)
  const statusRange = sheet.getRange("E6:E300");
  const paymentRange = sheet.getRange("F6:F300");
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("접수")
      .setBackground("#fff3c4")
      .setRanges([statusRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("연락완료")
      .setBackground("#cfe3fb")
      .setRanges([statusRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("미입금")
      .setBackground("#fbd4cf")
      .setFontColor("#a12b1f")
      .setBold(true)
      .setRanges([paymentRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("입금완료")
      .setBackground("#d6efce")
      .setFontColor("#2c5e1a")
      .setRanges([paymentRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("미진행")
      .setBackground("#e4e2da")
      .setFontColor("#6f7268")
      .setRanges([paymentRange])
      .build(),
  ];
  sheet.setConditionalFormatRules(rules);

  Logger.log("대시보드 세팅 완료! '현황판' 시트를 확인하세요.");
}

// 웹앱 배포 후, 홈페이지 폼에서 이 주소로 POST 요청을 보내면 아래 함수가 실행됨
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.topic || "",
    data.bizType || "",
    data.time || "",
    data.date || "",
    data.message || "",
    "접수",
    "미입금",
    "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
