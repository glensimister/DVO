$('.createAccount').click(function (data) {
    $('#login').hide();
    $('#register').show();
});

var port = chrome.runtime.connect({
    name: "dvo"
});

/**** Generate vanity key 
(async function () {

    let pair = await SEA.pair();
    let pubKey = pair.pub;
    let x = 3;
    let first = pubKey.substr(0, x);
    let last = pubKey.substr(-x);
    let count = 0;

    while (first !== last) {
        pair = await SEA.pair();
        pubKey = pair.pub;
        first = pubKey.substr(0, x);
        last = pubKey.substr(-x);
        count++;
    }
    console.log(first + " / " + last);
    console.log("Generating: " + pubKey + " took " + count + " attempts");

})();
/****/

isUserLoggedIn();

function isUserLoggedIn() {
    port.postMessage({
        type: "isUserLoggedIn"
    });
    port.onMessage.addListener(function (res) {
        if (res.type == "loggedIn" && res.response) {
            $('.logout').css('display', 'block');
            $('#form').css('display', 'none');
            $('.profile-photo').show();
            $('.profile-photo').attr("src", res.photo);
        }
    });
}

$('.register').click(function () {
    //let profileName = $('.profile-name').val()
    let profileName = "Guest User";

    port.postMessage({
        type: "register",
        username: $('.username').val(),
        password: $('.password').val(),
        name: profileName
    });

    port.onMessage.addListener(function (res) {
        if (res.response) {
            $('#register').hide(); // make more consistent
            $('#login').show();
            $('.logout').css('display', 'block');
            $('#form').css('display', 'none');
            $('#confirmation').show();
            $('#confirmation .name').html(profileName);
            $('.profile-photo').show();
            $('.profile-photo').attr("src", res.photo);
        }
    });
});

$('.login').click(function () {
    port.postMessage({
        type: "login",
        username: $('.username').val(),
        password: $('.password').val()
    });
    port.onMessage.addListener(function (res) {
        if (res.response) {
            $('.logout').css('display', 'block');
            $('#form').css('display', 'none');
        }
    });
});

$('.logout').on('click', function () {
    port.postMessage({
        type: "logout"
    });
    $('#confirmation').hide();
    $('.logout').css('display', 'none');
    $('#form').css('display', 'block');
    $('#login').show();
    $('.profile-photo').hide();
});

/*$('.clear').on("click", function () {
    localStorage.clear();
    sessionStorage.clear();
    user.leave();
});*/
