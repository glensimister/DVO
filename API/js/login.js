$('.createAccount').click(function (data) {
    $('#login').hide();
    $('#register').show();
});

var port = chrome.runtime.connect({
    name: "dvo"
});

isUserLoggedIn();

function isUserLoggedIn() {
    port.postMessage({
        type: "isUserLoggedIn"
    });
    port.onMessage.addListener(function (res) {
        if (res.type == "loggedIn" && res.response) {
            $('.logout').css('display', 'block');
            $('#form').css('display', 'none');
        }
    });
}

$('.register').click(function () {
    let profileName = $('.profile-name').val()
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

$('.logout').click(function () {
    port.postMessage({
        type: "logout"
    });
    port.onMessage.addListener(function (res) {
        if (res.response == "loggedOut") {
            $('.logout').css('display', 'none');
            $('#form').css('display', 'block');
        }
    });
});

/*$('.clear').on("click", function () {
    localStorage.clear();
    sessionStorage.clear();
    user.leave();
});*/
