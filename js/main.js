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
