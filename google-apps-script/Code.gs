/**
 * 세무회계 버들 - 상담 신청 폼 연동 스크립트
 *
 * 사용법:
 * 1. 새 구글 스프레드시트를 만든다.
 * 2. 확장 프로그램 > Apps Script 클릭 후, 이 파일 내용 전체를 붙여넣는다.
 * 3. 상단 함수 선택 드롭다운에서 setupSheet 선택 후 "실행" (최초 1회, 권한 승인 필요).
 * 4. 배포 > 새 배포 > 유형: 웹앱
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
];

const STATUS_OPTIONS = ["접수", "연락완료", "상담완료"];
const PAYMENT_OPTIONS = ["미입금", "입금완료"];

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
  const maxRows = 500;

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
  sheet.setConditionalFormatRules(rules);

  Logger.log("세팅 완료! '상담신청' 시트를 확인하세요.");
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
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
