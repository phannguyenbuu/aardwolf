function _update_user_bar(){
    if (window.SettingObj.userName) {
        // Hiển thị thông tin người dùng nếu đã đăng nhập
        $('.username, .password, .loginButton').hide();
        $('.menu-mobile').removeClass('active');
        $('.menu-mobile-img').hide();
        $('.userInfo').show();
        $('.userName').text(window.SettingObj.userName);
        $('.logoutButton').show();
        $('.menu-mobile').removeClass('active');

        if(document.getElementById('totalPrice'))
            document.getElementById('totalPrice').textContent = window.SettingObj.totalPrice;
        
    } else {
        // Hiển thị form đăng nhập nếu chưa đăng nhập
        $('.username, .password, .loginButton').show();
        $('.menu-mobile-img').show();
        $('.userInfo, .logoutButton').hide();
    }
}

$('.action-mobile .menu-mobile-img').on('click', function() {
    $('.menu-mobile').addClass('active');
});

$('.loginButton').click(function (e) {
    e.preventDefault();

    let username = '';
    let password = '';

    // Kiểm tra giao diện đang sử dụng: Desktop hay Mobile
    if ($('.action-desktop').is(':visible')) {
        username = $('.action-desktop .username').val().trim();
        password = $('.action-desktop .password').val().trim();
    } else if ($('.action-mobile').is(':visible')) {
        username = $('.menu-mobile .username').val().trim();
        password = $('.menu-mobile .password').val().trim();
    }

    // Kiểm tra nếu username hoặc password trống
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    // Gửi yêu cầu AJAX
    $.ajax({
            url: 'https://www.aardwolf.com.au/api/get_price.php',
            type: 'POST',
            data: {
                'txtUserName': username,
                'txtPassword': password,
                '_submit_login': 1
            },
            success: function (response) {
                if (response && response.user && response.user.name) {
                    window.SettingObj.priceList = response.price;
                    window.SettingObj.userName = response.user.name;
                    window.SettingObj.fromBack = true;
                    
                    window.SettingObj.saveLocalStorage();

                    // Ẩn form đăng nhập và hiển thị thông tin người dùng
                    $('.username, .password, .loginButton').hide();
                    $('.menu-mobile-img').hide();
                    $('.menu-mobile').removeClass('active');
                    $('.userInfo').show();
                    $('.userName').text(response.user.name);
                    $('.logoutButton').show();
                    // document.getElementById('totalPrice').textContent = '';//formatPrice(totalPrice);
                    // document.getElementById('totalPrice2').textContent = '';//formatPrice(totalPrice);
                    window.location.reload();
                } else {
                    alert('Login failed! Invalid username or password.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Login Failed:', error);
                alert('Login failed! Please try again later.');
            }
    });
});



// Xử lý sự kiện đăng xuất
$('.logoutButton').click(function () {
    // Xóa username khỏi localStorage
    window.SettingObj.userName = null;
    window.SettingObj.saveLocalStorage();

    $('.menu-mobile-img').show();
    $('.menu-mobile').removeClass('active');

    // Hiển thị lại form đăng nhập, ẩn thông tin người dùng
    $('.username, .password, .loginButton').show();
    $('.userInfo, .logoutButton').hide();
    window.location.reload();
});

document.querySelector('.password').addEventListener('keydown', function(event) {
    // Kiểm tra nếu phím nhấn là 'Enter' (keyCode 13)
    
    if (window.innerWidth > 820 && event.key === 'Enter') {
        event.preventDefault(); // Ngừng hành động mặc định của 'Enter' (tránh form submit nếu không muốn)
        document.querySelector('.loginButton').click(); // Tự động click nút Login
    }
});
