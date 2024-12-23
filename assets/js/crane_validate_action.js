const $craneTypeRadios = $('input[name="craneType"]');
const $jibOptions = $('.content__left-list--item:nth-child(2) .content__left-list-answer--item');
const $wllOptions = $('.content__left-list--item:nth-child(3) .content__left-list-answer--item');

function toggleOptions() {
    const isMobileCrane = $craneTypeRadios.eq(1).is(':checked');
    const isFloorMountedCrane = $craneTypeRadios.eq(0).is(':checked');
    const isWallMountedCrane = $craneTypeRadios.eq(2).is(':checked');
    const isFiveMeterSelected = $('input[name="jibLength"]:checked').attr('id') === '5m';

    // Enable all options initially
    $jibOptions.find('input[type="radio"]').prop('disabled', false);
    $wllOptions.find('input[type="radio"]').prop('disabled', false);

    // Apply specific disable rules
    if (isMobileCrane) {
        $jibOptions.eq(2).find('input[type="radio"]').prop('disabled', true);
        $jibOptions.eq(3).find('input[type="radio"]').prop('disabled', true);
    } else if (isFloorMountedCrane || isWallMountedCrane) {
        if (isWallMountedCrane) {
            $jibOptions.eq(0).find('input[type="radio"]').prop('disabled', true);
        }
    }
}

$craneTypeRadios.add($jibOptions.find('input[type="radio"]')).on('change', toggleOptions);

