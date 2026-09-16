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

    const nextYearly = (month, day) => {
      const year = today.getFullYear();
      let d = new Date(year, month - 1, day);
      if (d < today) d = new Date(year + 1, month - 1, day);
      return d;
    };

    const nextMonthly = (day) => {
      const year = today.getFullYear();
      const month = today.getMonth();
      let d = new Date(year, month, day);
      if (d < today) d = new Date(year, month + 1, day);
      return d;
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
