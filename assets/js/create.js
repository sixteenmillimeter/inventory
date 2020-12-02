'use strict';


function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#imageWrapper .display').attr('src', e.target.result);
            $('#imageWrapper').addClass('image');
        }

        reader.readAsDataURL(input.files[0]);
    }
}


function addCategory () {
    var val = prompt('Create new category');
    var option;
    var query;
    if (val) {
        query = '#category option[value="' + val + '"]';
        if ($(query).length > 0) {
            $(query).prop('selected', true);
        } else {
            option = $('<option value="' + val + '" selected>' + val + '</option>');
            $('#category').prepend(option);
        }
    }
}

function changeAction () {
    var el = $('input[name=action]:checked');
    var val = el.val();
    $('.btn-group .btn').removeClass('active');
    $('input[name=action][value="' + val + '"]').parent().addClass('active');
}

function openCamera (e) {
    $('#image').trigger('click');
    e.stopPropagation();
    return false;
}

(function (){
	$('#addCategory').on('click', addCategory);
    $('input[name=action]').on('change', changeAction);
    $("#image").change(function () {
        readURL(this);
    });
    $('#imageWrapper').on('mouseup', openCamera);
})()