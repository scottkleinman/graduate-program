$(document).ready(function () {
        fetch("./partials/navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navigation").innerHTML = data;
            document.getElementById(page).classList.add("active");
        })
        .catch(error => {
            console.log("Could not load the navbar.")
        });
    });
    
    let topBtn = document.getElementById("btn-back-to-top");
    
    // Show button when the user scrolls down 20px from the top
    window.onscroll = function () {
      scrollFunction();
    };
    
    function scrollFunction() {
      if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
      ) {
        topBtn.style.display = "block";
      } else {
        topBtn.style.display = "none";
      }
    }
    // Onclick, scroll to the top
    topBtn.addEventListener("click", backToTop);
    
    function backToTop() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }