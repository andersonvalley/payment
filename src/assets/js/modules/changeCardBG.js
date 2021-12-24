const card = document.querySelector(".card");

const changeCardBG = () => {
  const arrImages = [
    { link: "assets/img/card-bg/1.jpg" },
    { link: "assets/img/card-bg/2.jpg" },
    { link: "assets/img/card-bg/3.jpg" },
    { link: "assets/img/card-bg/4.jpg" },
    { link: "assets/img/card-bg/5.jpg" },
    { link: "assets/img/card-bg/6.jpg" },
    { link: "assets/img/card-bg/7.jpg" },
    { link: "assets/img/card-bg/8.jpg" },
    { link: "assets/img/card-bg/9.jpg" },
  ];

  let number = 1;
  function randomNumber(arr) {
    number = Math.floor(Math.random() * arr.length);
    return number;
  }

  card.setAttribute(
    "style",
    `background-image: url('${arrImages[randomNumber(arrImages)].link}')`
  );
};

export default changeCardBG;
