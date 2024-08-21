// HTML 요소들을 가져오는 코드 ==================================================================

// 포켓몬 목록을 표시할 HTML 요소를 선택
const pokemonListContainer = document.querySelector(".pokemon-list");
// 검색 입력 필드를 선택
const searchInput = document.getElementById("searchInput");
// 포켓몬의 상세 정보를 표시할 HTML 요소를 선택
const pokemonDetail = document.getElementById("pokemonDetail");
// 테마를 전환하는 버튼 요소를 선택
const themeToggleBtn = document.getElementById("themeToggleBtn");
// 테마 버튼의 아이콘을 변경할 이미지 요소를 선택
const themeIcon = document.getElementById("themeIcon");

//

// 모든 포켓몬 데이터를 저장할 배열 ==============================================================
let allPokemon = []; //API에서 가져온 모든 포켓몬 데이터 저장, 전체 포켓몬 목록을 유지하는 배열
let filteredPokemon = []; //필터링된 포켓몬 데이터 저장 배열, 필터링할 때 이 배열이 업데이트

//

// 각 포켓몬 타입에 해당하는 아이콘을 저장한 객체 ==================================================
// 타입 이름과 아이콘 이미지 경로를 매핑, 포켓몬카드와 상세정보에 아이콘 표시
const typeIcons = {
  노말: "images/normal.png",
  불꽃: "images/fire.png",
  물: "images/water.png",
  풀: "images/grass.png",
  비행: "images/flying.png",
  독: "images/poison.png",
  전기: "images/electric.png",
  땅: "images/ground.png",
  바위: "images/rock.png",
  에스퍼: "images/psychic.png",
  얼음: "images/ice.png",
  벌레: "images/bug.png",
  고스트: "images/ghost.png",
  강철: "images/steel.png",
  드래곤: "images/dragon.png",
  악: "images/dark.png",
  페어리: "images/fairy.png",
  격투: "images/fighting.png",
};

//

// 테마 변경 기능 ==================================================================================
// 클릭시 dark-mode 클래스를 body 태그에 추가하거나 제거해서 활성화or비활성화
// dark-mode 클래스 css 스타일을 지정하는데 사용
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeIcon.src = document.body.classList.contains("dark-mode")
    ? "images/moon.png"
    : "images/sun.png";
  // themeIcon.src = 테마에 따라 아이콘 이미지를 변경
  // dark-mode가 활성화되면 달아이콘으로 바뀌고, 아니면 태양아이콘으로 바뀜
});

//

// 포켓몬 데이터를 병렬로 가져오는 함수 ==============================================================

// fetchPokemon(): 포켓몬 데이터를 병렬로, 151개의 포켓몬 데이터를 가져오려고 Promise.all을 사용
async function fetchPokemon() {
  try {
    // Array.from: 151개의 포켓몬 데이터를 가져오기 위한 배열을 생성
    // _는 배열의 요소(사용하지 않기 때문에 이름이 _로 지정됨)
    const promises = Array.from({ length: 151 }, (_, i) =>
      // fetch를 사용해 각 포켓몬 데이터를 비동기적으로 요청
      // 포켓몬의 id는 1부터 시작, 자바스크립트의 배열인덱스는 0부터 시작, 그래서 +1
      fetch(`https://pokeapi.co/api/v2/pokemon/${i + 1}`).then((res) =>
        res.json()
      )
    );

    // Promise.all: 여러 개의 fetch 요청을 병렬로 수행
    //               모든 요청이 완료될 때까지 대기
    const pokemonData = await Promise.all(promises); // 이때 모든 포켓몬 데이터가 배열 형태로 반환
    // 포켓몬의 한국어이름,타입,설명을 가공해 allPokemon 배열에 저장
    allPokemon = await Promise.all(
      pokemonData.map(async (pokemon) => {
        const species = await fetchJson(pokemon.species.url);
        const name = findKoreanName(species.names) || pokemon.name;
        const types = await getTypesInKorean(pokemon.types);
        const description = findKoreanDescription(species.flavor_text_entries);

        return {
          id: pokemon.id,
          name,
          types,
          image: pokemon.sprites.front_default,
          height: pokemon.height,
          weight: pokemon.weight,
          stats: formatStats(pokemon.stats),
          description,
        };
      })
    );

    filteredPokemon = allPokemon; //처음에는 모든 포켓몬이 필터링된 목록에 포함되도록 초기화
    displayPokemon(filteredPokemon); //가져온 포켓몬 데이터를 화면에 표시
    setupTypeButtonListeners(); //타입별 필터링 기능을 설정하는 함수
  } catch (error) {
    console.error(error);
  }
}

//=================================================================================================

// 간단한 비동기 JSON 요청 함수
// 중복된 fetch 요청을 간소화하기 위해 사용
async function fetchJson(url) {
  const response = await fetch(url);
  return response.json();
}

// 한국어 이름 찾기 함수, species 데이터에서 이름을 가져올 때 사용
function findKoreanName(names) {
  return names.find((n) => n.language.name === "ko")?.name;
  // 포켓몬의 names 배열에서 한국어 이름을 찾기
  // 한국어 이름이 존재하지않으면 기본 이름을 사용
}

// 타입 정보를 한국어로 변환하는 함수
// types 배열을 가져와 각 타입의 이름을 한국어로 변환하는 역할
async function getTypesInKorean(types) {
  const promises = types.map((t) => fetchJson(t.type.url));
  const typeData = await Promise.all(promises);
  return typeData.map(
    (type) => type.names.find((n) => n.language.name === "ko").name
  );
}

// 한국어 설명 찾기 함수
function findKoreanDescription(entries) {
  return (
    entries.find((entry) => entry.language.name === "ko")?.flavor_text ||
    "정보 없음"
  );
}

// 능력치 포맷팅 함수
function formatStats(stats) {
  return stats.map((stat) => ({
    name: stat.stat.name,
    value: stat.base_stat,
  }));
}

// 타입 버튼에 이벤트 리스너를 추가하는 함수 =========================================================
// .type-buttons 클래스 아래에 있는 모든 버튼에 클릭 이벤트를 추가하는 역할
function setupTypeButtonListeners() {
  //.type-buttons 클래스 내부에 있는 모든 버튼 요소를 선택
  //forEach 메서드를 사용하여 각 버튼에 대해 이벤트 리스너를 추가
  document.querySelectorAll(".type-buttons button").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".type-buttons button")
        //버튼이 클릭되면, 모든 버튼에서 active 클래스를 제거
        .forEach((btn) => btn.classList.remove("active"));
      //클릭된 버튼에 active 클래스를 추가, 활성화된 버튼 시각적으로 표시
      button.classList.add("active");

      // button.id를 사용하여 클릭된 버튼의 id 값을 가져오고
      const type = button.id;
      filteredPokemon =
        //해당 id가 "all"인지 확인
        type === "all"
          ? allPokemon
          : allPokemon.filter((pokemon) => pokemon.types.includes(type));
      //all이면 모든 포켓몬을 표시, all이 아니면  해당 타입의 포켓몬만 필터링후 표시

      displayPokemon(filteredPokemon); //함수를 호출, 필터링된 포켓몬을 화면에 표시
    });
  });
}

// 포켓몬 목록을 화면에 표시하는 함수 ===============================================================
function displayPokemon(pokemonArray) {
  pokemonListContainer.innerHTML = pokemonArray
    //map 메서드를 사용, 각 포켓몬을 카드 형태로 변환한 후
    .map((pokemon) => generatePokemonCard(pokemon))
    //join("")을 사용하여 하나의 HTML 문자열로 합쳐서 삽입
    .join("");
}

//

// 포켓몬 카드 생성 함수 ============================================================================
// 주어진 포켓몬 객체를 기반으로 포켓몬 카드를 생성하는 역할
function generatePokemonCard(pokemon) {
  // 포켓몬의 이미지, 이름, 타입 아이콘을 포함하는 HTML 문자열을 반환
  // 포켓몬을 클릭하면 해당 포켓몬의 정보를 보여주는 showPokemonDetail() 함수가 호출
  return `
    <div class="pokemon" onclick="showPokemonDetail(${pokemon.id})">
      <img src="${pokemon.image}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
      <div class="pokemon-types">
        ${pokemon.types
          .map(
            (type) =>
              `<img src="${typeIcons[type]}" alt="${type}" style="width: 24px; height: 24px;">`
          )
          .join("")}
      </div>
    </div>`;
}

//

// 포켓몬의 상세 정보를 보여주는 함수 ===================================================================
function showPokemonDetail(pokemonId) {
  // find를 사용해 allPokemon 배열에서 해당 포켓몬의 ID와 일치하는 포켓몬 데이터 찾기
  const pokemon = allPokemon.find((p) => p.id === pokemonId);
  // 포켓몬의 이미지, 이름, 타입 아이콘, 키, 몸무게, 설명, 그리고 능력치 바를 포함하는 HTML을 삽입
  pokemonDetail.innerHTML = `
    <div class="pokemon-info">
      <div class="image-and-stats">
        <img src="${pokemon.image}" alt="${pokemon.name}" class="pokemon-img">
        <div class="stats">
          <div class="name-and-types">
            <p><b>${pokemon.name}</b></p>
            ${pokemon.types
              .map(
                (type) =>
                  `<img src="${typeIcons[type]}" alt="${type}" style="width: 24px; height: 24px;">`
              )
              .join("")}
          </div>
          <p><b>키:</b> ${pokemon.height / 10} m</p>
          <p><b>몸무게:</b> ${pokemon.weight / 10} kg</p>
          <p>${pokemon.description}</p>
        </div>
      </div>
      <div class="pokemon-stats">
        <h3>능력치</h3>
        ${pokemon.stats
          .map(
            (stat) => `
            <div class="stat-line">
              <span>${stat.name.replace("special-", "sp.")}</span>
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${stat.value}%"></div>
              </div>
              <span>${stat.value}</span>
            </div>`
          )
          .join("")}
      </div>
      <button onclick="closeDetail()" class="close-btn">X</button>
    </div>`;
  // 능력치 바는 pokemon.stats 배열을 map 메서드로 순회하며 생성
  // 각 능력치의 이름과 값을 표시, 해당 값을 기반으로 채워진 막대(stat-bar-fill)를 생성
  // 포켓몬 상세 창을 닫는 버튼을 생성, 클릭 시 closeDetail() 함수가 호출
  pokemonDetail.style.display = "flex"; // 상세 정보 창을 표시
}

//

// 포켓몬 상세 정보 창을 닫는 함수 ==========================================================================
function closeDetail() {
  pokemonDetail.style.display = "none";
}

//

// 검색 입력 필드에서 입력이 변경될 때마다 포켓몬을 필터링하는 함수 =============================================
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value;
  displayPokemon(
    filteredPokemon.filter((pokemon) => pokemon.name.includes(searchTerm))
    //포켓몬 이름이 사용자가 입력한 검색어를 포함하고 있는지 확인
  );
});

//

// 페이지가 로드될 때 초기 포켓몬 데이터를 불러오는 함수 호출 =====================================================
fetchPokemon();
