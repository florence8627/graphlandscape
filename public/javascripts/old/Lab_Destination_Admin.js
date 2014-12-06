//  /javascripts/Lab_Destination.js
var dest = ['HAPL','OUTJ','','','','','HOLT','','',''];
var swpr = [6     ,  1   ,2 ,3 ,4 ,5 ,0     ,7 ,8 ,9 ];


function onSelect() {

//  $('#LNS_TYP').val('NULUX');

  INDX = $('#INDX').val();
  LNS_TYP = $('#LNS_TYP').val();
  LNS_CLR = $('#LNS_CLR').val();
  LNS_COAT = $('#LNS_COAT').val();

  LNS_TYP  = LNS_TYP  + '%';
  LNS_COAT = LNS_COAT + '%';
  LNS_TYP  = LNS_TYP.substring(0,12);
  LNS_COAT = LNS_COAT.substring(0,8);


  $.ajax({url:'/Lab_Destination.Ajax/?ACTION=SELECT&INDX=' + INDX + '&LNS_TYP=' + LNS_TYP + '&LNS_CLR=' + LNS_CLR + '&LNS_COAT=' + LNS_COAT,
      type:'GET',
      beforeSend: function () {
          $('#status').html('<img class="select-status" src="../ajax-loader.gif" />').fadeIn(); // add a gif loader  
      },
      success: function (response) {
          $('#status').html('<img class="select-status" src="../ajax-success.png" />').fadeIn();

          var c = [];
          var i = 0, j = 0;
          var tr = ['hi_light','lo_light'];

          $.each(response, function(i, item) {
            if ( i % 3 == 0 ) j = 1 - j;
            c.push("<tr class='" + tr[j] + "' id='row_"+ i +"'>");
            c.push("<td>" + item.INDX + "</td>");
            c.push("<td>" + item.LNS_TYP + "</td>");
            c.push("<td>" + item.LNS_CLR + "</td>");
            c.push("<td>" + item.LNS_COAT + "</td>");
            c.push("<td>" + item.NSW + "</td>");
            c.push("<td>" + item.VIC + "</td>");
            c.push("<td>" + item.QLD + "</td>");
            c.push("<td>" + item.SA + "</td>");
            c.push("<td>" + item.NZ + "</td>");
            c.push("<td>" + item.DLV + "</td>");
            c.push("<td>" + item.HOLT + "</td>");
            if (dest[item.NSW.substr(0,1)] == '') {
              c.push("<td></td>");
            } else {
              c.push("<td>" + "<div class='super-centered'><button class='swBtn swBtnOff' name='"+item.NSW.substr(0,1)+"' onclick='btnSelect(this)'>" + dest[item.NSW.substr(0,1)] + "</button></div>" + "</td>");
            }
            c.push("<td class='super-centered'></td>");
            c.push("</tr>");
            i++;
          });

          $('#data_tbody').html(c.join(""));

      },
      error: function () {
          $('#status').html('<img class="select-status" src="../ajax-failure.png" />').fadeIn();
      }
    });
}

function btnSelect(btn) {

  if (btn.name == swpr[btn.name]) return;

  if ($(btn).hasClass('swBtnOff')){
     $(btn).removeClass('swBtnOff').addClass('swBtnOn');
  } else {
     $(btn).removeClass('swBtnOn').addClass('swBtnOff');
  }

  btn.innerHTML = dest[swpr[btn.name]];
  btn.name = swpr[btn.name];

  $('#status').html("<div class='super-centered'><button id='updateBtn' onclick='onUpdate()'>Update</button></div>")
}

function onUpdate() {

  var swBtn   = document.getElementsByClassName('swBtn');
  var swBtnOn = document.getElementsByClassName('swBtnOn');

  var data = new Array();
  for (var i = 0; i < swBtnOn.length; i++) {
      var row = new Array();
      row.push(swBtnOn[i].parentNode.parentNode.parentNode.id);
      row.push(swBtnOn[i].parentNode.parentNode.parentNode.childNodes[1].innerHTML);
      row.push(swBtnOn[i].parentNode.parentNode.parentNode.childNodes[2].innerHTML);
      row.push(swBtnOn[i].parentNode.parentNode.parentNode.childNodes[3].innerHTML);
      row.push(swBtnOn[i].innerHTML);
      row.push(swBtnOn[i].parentNode.parentNode.parentNode.childNodes[10].innerHTML);
      data.push(row);
  }

  $.ajax({ type:'POST'
          ,url:'/Lab_Destination.Ajax/?ACTION=UPDATE'
          ,data: JSON.stringify(data)
          ,contentType: 'application/json; charset=utf-8'
          ,dataType: 'json'
          ,beforeSend: function () {
            for (var i = 0; i < swBtn.length; i++) {
              $(swBtn[i].parentNode.parentNode.parentNode).removeClass('updated');
              if ( $(swBtn[i]).hasClass('swBtnOn') ) {
                swBtn[i].parentNode.parentNode.parentNode.childNodes[12].innerHTML = '<img class="update-status" src="../ajax-loader.gif" />';
              } else {
                swBtn[i].parentNode.parentNode.parentNode.childNodes[12].innerHTML = '';
              }
              $(swBtn[i]).removeClass('swBtnOn').addClass('swBtnOff');
            }
          }
          ,success: function (response) {
            $.each(response, function(i, item) {
                var e = document.getElementById(item.ROW_);
                e.classList.add('updated');
                e.childNodes[4].innerHTML = item.NSW;
                e.childNodes[5].innerHTML = item.VIC;
                e.childNodes[6].innerHTML = item.QLD;
                e.childNodes[7].innerHTML = item.SA;
                e.childNodes[8].innerHTML = item.NZ;
                e.childNodes[9].innerHTML = item.DLV;
                e.childNodes[11].childNodes[0].childNodes[0].name = item.NSW.substr(0,1);
                e.childNodes[11].childNodes[0].childNodes[0].innerHTML = dest[item.NSW.substr(0,1)];
                if (item.R == 'Y') {
                  e.childNodes[12].innerHTML = '<img class="update-status" src="../ajax-success.png" />';
                } else {
                  e.childNodes[12].innerHTML = '<img class="update-status" src="../ajax-failure.png" />';
                }
            });           
          }
          ,error: function () {
            $('#status').html('<img class="select-status" src="../ajax-failure.png" />').fadeIn();
          }
        });

}

function onDelete() {
  LABO_CD = $('#LABO_CD').val();
  RCV_NO = $('#RCV_NO').val();

  $.ajax({url:'/Lab_Destination.Ajax/?LABO_CD=' + LABO_CD + '&RCV_NO=' + RCV_NO,
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
