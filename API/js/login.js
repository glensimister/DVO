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
});

/*$('.clear').on("click", function () {
    localStorage.clear();
    sessionStorage.clear();
    user.leave();
});*/
