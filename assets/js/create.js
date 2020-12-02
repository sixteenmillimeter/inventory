'use strict';

/*
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#blah').attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#imgInp").change(function(){
    readURL(this);
});*/

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

(function (){
	$('#addCategory').on('click', addCategory);
    $('input[name=action]').on('change', changeAction);
})()