document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");
  const scrollTop = document.getElementById("scrollTop");

  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mobileNav.classList.remove("open"));
  });

  window.addEventListener("scroll", () => {
    scrollTop.classList.toggle("visible", window.scrollY > 400);
  });

  const deadlineGrid = document.getElementById("deadlineGrid");
  if (deadlineGrid) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 관공서 공휴일 + 대체공휴일 + 근로자의 날 (국세기본법 제5조 기한 특례 적용 대상)
    const holidaySet = new Set([
      "2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18", "2026-03-01",
      "2026-03-02", "2026-05-01", "2026-05-05", "2026-05-24", "2026-05-25",
      "2026-06-06", "2026-07-17", "2026-08-15", "2026-08-17", "2026-09-24",
      "2026-09-25", "2026-09-26", "2026-10-03", "2026-10-05", "2026-10-09",
      "2026-12-25",
      "2027-01-01", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09",
      "2027-03-01", "2027-05-01", "2027-05-05", "2027-05-13", "2027-06-06",
      "2027-06-07", "2027-07-17", "2027-08-15", "2027-08-16", "2027-09-14",
      "2027-09-15", "2027-09-16", "2027-10-03", "2027-10-04", "2027-10-09",
      "2027-10-11", "2027-12-25", "2027-12-27",
    ]);

    const pad = (n) => String(n).padStart(2, "0");
    const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // 기한이 토·일요일 또는 공휴일이면 다음 영업일로 순연
    const toBusinessDay = (d) => {
      const adjusted = new Date(d);
      while (adjusted.getDay() === 0 || adjusted.getDay() === 6 || holidaySet.has(dateKey(adjusted))) {
        adjusted.setDate(adjusted.getDate() + 1);
      }
      return adjusted;
    };

    const nextYearly = (month, day) => {
      const year = today.getFullYear();
      let d = new Date(year, month - 1, day);
      if (d < today) d = new Date(year + 1, month - 1, day);
      return toBusinessDay(d);
    };

    const nextMonthly = (day) => {
      const year = today.getFullYear();
      const month = today.getMonth();
      let d = new Date(year, month, day);
      if (d < today) d = new Date(year, month + 1, day);
      return toBusinessDay(d);
    };

    const items = [
      { name: "부가가치세 2기 확정신고", desc: "법인·개인 일반과세자", date: nextYearly(1, 25) },
      { name: "부가가치세 1기 예정신고", desc: "법인사업자", date: nextYearly(4, 25) },
      { name: "종합소득세 확정신고", desc: "개인사업자·프리랜서", date: nextYearly(5, 31) },
      { name: "부가가치세 1기 확정신고", desc: "법인·개인 일반과세자", date: nextYearly(7, 25) },
      { name: "부가가치세 2기 예정신고", desc: "법인사업자", date: nextYearly(10, 25) },
      { name: "법인세 신고·납부", desc: "12월 결산법인", date: nextYearly(3, 31) },
      { name: "원천세 신고·납부", desc: "매월 정기", date: nextMonthly(10) },
    ];

    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const formatDate = (d) =>
      `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;

    items
      .map((item) => ({
        ...item,
        dDay: Math.round((item.date - today) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.dDay - b.dDay)
      .slice(0, 4)
      .forEach((item) => {
        const card = document.createElement("div");
        card.className = "deadline-card" + (item.dDay <= 7 ? " urgent" : "");
        card.innerHTML = `
          <span class="dday">${item.dDay === 0 ? "D-DAY" : "D-" + item.dDay}</span>
          <h3>${item.name}</h3>
          <p>${formatDate(item.date)} · ${item.desc}</p>
        `;
        deadlineGrid.appendChild(card);
      });
  }

  const mapContainer = document.getElementById("kakaoMap");
  if (mapContainer && window.kakao && window.kakao.maps) {
    kakao.maps.load(() => {
      const address = "서울시 서초구 동광로 99";
      const map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(37.4934, 127.0158),
        level: 3,
      });

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
          map.setCenter(coords);
          new kakao.maps.Marker({ map, position: coords });
        }
      });
    });
  }
});
