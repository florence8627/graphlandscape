//  /javascripts/Customer_Price_List.js

function addInput(elm) {   
    elm.setAttribute("ondblclick","return false");
    var id = elm.id;
    var size = elm.parentNode.parentNode.parentNode.tHead.rows[0].cells[elm.cellIndex].offsetWidth / 9;
//    console.log(width);

    var value = document.getElementById(id).innerHTML;
    elm.name = value;
    document.getElementById(id).innerHTML = "<input size='"+size+"' type='text' id='input"+id +"' value='"+value+"' onblur='closeInput(this)' onkeyup='function(e){if(e.which == 13){closeInput(this)}}'/>";            
    document.getElementById("input"+id).focus();                
}

function closeInput(elm) {
    var td = elm.parentNode;
    var value = elm.value;
    td.removeChild(elm);
    td.innerHTML = value;
    elm.parentNode.name = 'check';
    td.setAttribute("ondblclick",'addInput(this)');
}
function onLoad() {

  var PRC_NO = 51;

  $.ajax({url:'/Customer_Price_List_Admin.Ajax/?ACTION=SELECT&PRC_NO=' + PRC_NO,
      type:'GET',
      beforeSend: function () {
          $('#status').html('<img src="../ajax-loader.gif" />').fadeIn(); // add a gif loader  
      },
      success: function (response) {
          $('#status').html('<img src="../ajax-success.png" />').fadeIn();

          var tr = ['hi_light','lo_light'];
          var c = [];
          var i = -2, j = 0;
          var row_class;
          var cols = 9;
          $.each(response, function(i, item) {

            switch(item.STRX) {
                case 'H1':
                    i = 0;
                    el = 'th';
                    row_class = 'H1';
                    row_height = " height='60px'";
                    cols = 9;
                    break;
                case 'H2':
                    i = 0;
                    el = 'th';
                    row_class = 'H2';
                    row_height = " height='60px'";
                    cols = parseInt(item.LNS_TYP);
                    break;
                case 'H3':
                    el = 'th';
                    row_class = 'H3';
                    row_height = " height='20px'";
                    break;
                case 'H4':
                    el = 'th';
                    row_class = 'H4';
                    row_height = " height='20px'";
                    break;
                case 'LT':
                    el = 'th';
                    row_class = 'LT, legal-text'; 
                    row_height = " height='20px'";
                    break;
                default:
                    el = 'td';
                    row_class = tr[j]; 
                    row_height = " height='20px'";
                    break;
            }

            if ( i % 3 == 0 ) j = 1 - j;

            c.push("<tr class='" + row_class + "' id='row_"+ item.SEQ +"'>");
            c.push("<"+el+" id='td1_"+ item.SEQ +"' ondblclick='addInput(this)' class='product'" + row_height +">" + item.PRODUCT + "</"+el+">");
            c.push("<"+el+" id='td2_"+ item.SEQ +"' ondblclick='addInput(this)' class='index'>" + item.INDX + "</"+el+">");
            c.push("<"+el+" id='td3_"+ item.SEQ +"' ondblclick='addInput(this)' class='diameter'>" + item.DIAMETER + "</"+el+">");
            c.push("<"+el+" id='td4_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT1 + "</"+el+">");
            if ( cols >= 5 ) c.push("<"+el+" id='td5_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT2 + "</"+el+">");
            if ( cols >= 6 ) c.push("<"+el+" id='td6_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT3 + "</"+el+">");
            if ( cols >= 7 ) c.push("<"+el+" id='td7_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT4 + "</"+el+">");
            if ( cols >= 8 ) c.push("<"+el+" id='td8_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT5 + "</"+el+">");
            if ( cols >= 9 ) c.push("<"+el+" id='td9_"+ item.SEQ +"' ondblclick='addInput(this)' class='lns_coat'>" + item.LNS_COAT6 + "</"+el+">");
            c.push("</tr>");
            i++;
          });

          $('#data_body').html(c.join(""));
          $('#data_table').removeClass('hidden');
      },
      error: function () {
          $('#status').html('<img src="../ajax-failure.png" />').fadeIn();
      }
    });
}

onLoad();
