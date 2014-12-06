//  /javascripts/Delete_Invisible_Chocolate.js

function onDelete() {
  LABO_CD = $('#LABO_CD').val();
  RCV_NO = $('#RCV_NO').val();

  $.ajax({url:'/Delete_Invisible_Chocolate.Ajax/?ACTION=SELECT&LABO_CD=' + LABO_CD + '&RCV_NO=' + RCV_NO,
      type:'GET',
      beforeSend: function () {
          $('#status').html('<img src="../ajax-loader.gif" />').fadeIn(); // add a gif loader  
      },
      success: function () {
          $('#status').html('<img src="../ajax-success.png" />').fadeIn();
      },
      error: function () {
          $('#status').html('<img src="../ajax-failure.png" />').fadeIn();
      }
    });
}


function onDel(id) {
  sel = '#id_' + id;
  userId = $(sel).find('td:eq(0)').text();

  $.ajax({url:'/users/' + userId,type:'DELETE'})
    .done(function() {
      window.location.href = "/";
    });
}
