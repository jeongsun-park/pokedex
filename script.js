const pokemonListContainer = document.querySelector(".pokemon-list");
const typeButtonsContainer = document.querySelector(".type-buttons");
const searchInput = document.getElementById("searchInput");
const pokemonDetail = document.getElementById("pokemonDetail");
let allPokemon = []; // 모든 포켓몬 데이터를 저장할 배열
let allTypes = []; // 모든 타입을 저장할 배열
let filteredPokemon = []; // 필터링된 포켓몬 데이터를 저장할 배열
let offset = 0; // 포켓몬 데이터를 불러올 시작 위치
const limit = 20; // 한번에 로딩할 포켓몬 수

// 타입별 아이콘 설정
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

// 포켓몬 데이터를 병렬로 요청하여 한 번에 불러오는 함수
async function fetchPokemon() {
  try {
    // 요청을 병렬로 처리하기 위해 Promise 배열 생성
    const promises = [];

    for (let i = 1; i <= 151; i++) {
      promises.push(
        fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then((res) =>
          res.json()
        )
      );
    }

    const pokemonData = await Promise.all(promises); // 모든 요청이 완료될 때까지 대기

    for (const pokemon of pokemonData) {
      const speciesResponse = await fetch(pokemon.species.url);
      const species = await speciesResponse.json();
      const name =
        species.names.find((n) => n.language.name === "ko")?.name ||
        pokemon.name;
      const types = await Promise.all(
        pokemon.types.map(async (t) => {
          const typeResponse = await fetch(t.type.url);
          const typeData = await typeResponse.json();
          const typeName = typeData.names.find(
            (n) => n.language.name === "ko"
          ).name;
          return typeName;
        })
      );
      const stats = pokemon.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      }));
      const description =
        species.flavor_text_entries.find(
          (entry) => entry.language.name === "ko"
        )?.flavor_text || "정보 없음";

      // 중복된 포켓몬이 없을 때만 추가
      if (!allPokemon.some((p) => p.id === pokemon.id)) {
        allPokemon.push({
          id: pokemon.id,
          name,
          types,
          image: pokemon.sprites.front_default,
          height: pokemon.height,
          weight: pokemon.weight,
          stats,
          description,
        });
      }
    }

    // 모든 포켓몬 데이터를 한 번에 출력
    displayPokemon(allPokemon);
    extractAndDisplayTypes(); // 타입 버튼 생성
  } catch (error) {
    console.error(error);
  }
}

// 모든 타입 버튼을 생성하는 함수
function extractAndDisplayTypes() {
  if (typeButtonsContainer.childElementCount === 0) {
    // 타입 아이콘에 있는 모든 타입을 사용하여 버튼 생성
    allTypes = Object.keys(typeIcons);

    // 전체 보기 버튼 생성
    const allButton = document.createElement("button");
    allButton.innerHTML = `<img src="images/all.png" alt="전체" style="width: 50px; height: 50px;">`;
    allButton.addEventListener("click", () => {
      displayPokemon(allPokemon);

      // 모든 버튼의 active 클래스 제거 후 allButton에 적용
      document.querySelectorAll(".type-buttons button").forEach((btn) => {
        btn.classList.remove("active");
      });
      allButton.classList.add("active");
    });
    typeButtonsContainer.appendChild(allButton);

    // 타입별 버튼 생성
    allTypes.forEach((type) => {
      const button = document.createElement("button");
      button.innerHTML = `<img src="${typeIcons[type]}" alt="${type}" style="width: 50px; height: 50px;">`;
      button.addEventListener("click", () => filterByType(type, button));
      typeButtonsContainer.appendChild(button);
    });
  }
}

// 필터링된 포켓몬 데이터를 화면에 표시하는 함수
function displayPokemon(pokemonArray) {
  pokemonListContainer.innerHTML = ""; // 기존 목록 초기화
  pokemonArray.forEach((pokemon) => {
    const pokemonDiv = document.createElement("div");
    pokemonDiv.classList.add("pokemon");
    pokemonDiv.innerHTML = `
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
        `;
    pokemonDiv.addEventListener("click", () => showPokemonDetail(pokemon));
    pokemonListContainer.appendChild(pokemonDiv);
  });
}

// 포켓몬의 상세 정보를 보여주는 함수
function showPokemonDetail(pokemon) {
  const detailHtml = `
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
            </div>
          `
          )
          .join("")}
      </div>
      <button onclick="closeDetail()" class="close-btn">X</button>
    </div>
  `;

  pokemonDetail.innerHTML = detailHtml;
  pokemonDetail.style.display = "flex"; // 포켓몬 정보 창을 열 때만 flex로 표시
}

// 포켓몬 상세 정보 창을 닫는 함수
function closeDetail() {
  // 상세 정보 창을 닫을 때 display를 none으로 설정
  pokemonDetail.style.display = "none";
}

// 타입별로 포켓몬을 필터링하는 함수
function filterByType(type, button) {
  filteredPokemon = allPokemon.filter((pokemon) =>
    pokemon.types.includes(type)
  );
  displayPokemon(filteredPokemon);

  // 모든 버튼의 active 클래스 제거 후 현재 버튼에 적용
  document.querySelectorAll(".type-buttons button").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

// 검색 입력 필드에서 입력이 변경될 때마다 포켓몬을 필터링하는 함수
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value.toLowerCase();
  const filtered = allPokemon.filter((pokemon) =>
    pokemon.name.includes(searchTerm)
  );
  displayPokemon(filtered);
});

// 초기 포켓몬 데이터를 불러오는 함수 호출
fetchPokemon();
