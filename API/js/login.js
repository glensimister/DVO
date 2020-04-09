$('.createAccount').click(function (data) {
    $('#login').hide();
    $('#register').show();
});

var port = chrome.runtime.connect({
    name: "dvo"
});



$('.generate').click(async function () {
    $('#keys').html(`<div>Generating keys...</div><img src="/images/widget-loader.gif" /><p>This may take a few minutes. Please don't touch anything while your keys are being generated.</p>`);
    let pair = await SEA.pair();
    let pubKey = pair.pub;
    let x = 2;
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
    $('#generate').html(`<button class="copy btn btn-green"><i class="fa fa-clipboard"></i>&nbsp;&nbsp;COPY TO CLIPBOARD</button>`);
    $('#keys').html(`<div>Your keys have been generated. Please copy them to the clipboard, click 'register' below, and then paste your keys in a safe place!</div><input id="output" class="form-control" value="Public Key : ${pubKey} | Private Key: ${pair.priv}" />`);
    $('.username').val(pubKey);
    $('.password').val(pair.priv);
    console.log(first + " / " + last);
    console.log("Generating: " + pubKey + " took " + count + " attempts");
});

$('#generate').on('click', '.copy', function () {
    //let usr = $('.username');
    //let pw = $('.password');
    //usr.select();
    //pw.select();
    let output = document.getElementById('output');
    output.select();
    document.execCommand("copy");
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
            $('.profile-photo').show();
            $('.profile-photo').attr("src", res.photo);
        }
    });
}


$('.register').click(function () {
    //let profileName = $('.profile-name').val()
    //let profileName = "Guest User";

    port.postMessage({
        type: "register",
        username: $('.username').val(),
        password: $('.password').val()
    });

    port.onMessage.addListener(function (res) {
        if (res.response) {
            $('#register').hide(); // make more consistent
            $('#login').show();
            $('.logout').css('display', 'block');
            $('#form').css('display', 'none');
            $('#confirmation').show();
            $('#confirmation .name').html("Guest User");
            $('#confirmation .url').html(`<a target="_blank" href="http://localhost:8000/?userId=${res.userId}">http://localhost:8000/?userId=${res.userId}</a>`);
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
