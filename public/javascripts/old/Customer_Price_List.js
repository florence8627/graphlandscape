//  /javascripts/Customer_Price_List.js


function onSelect() {
  CSTM_CD = $('#CSTM_CD').val();

  // Testing
//  CSTM_CD = 42;  

  $.ajax({url:'/Customer_Price_List.Ajax/?ACTION=SELECT&CSTM_CD=' + CSTM_CD,
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
                    row_height = " height='60px' colspan='9'";
                    cols = 1;
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
            if ( cols >= 1 ) c.push("<"+el+" id='td1_"+ item.SEQ +"' class='product'"   + row_height +">" + item.PRODUCT + "</"+el+">");
            if ( cols >= 2 ) c.push("<"+el+" id='td2_"+ item.SEQ +"' class='index'>"    + item.INDX + "</"+el+">");
            if ( cols >= 3 ) c.push("<"+el+" id='td3_"+ item.SEQ +"' class='diameter'>" + item.DIAMETER + "</"+el+">");
            if ( cols >= 4 ) c.push("<"+el+" id='td4_"+ item.SEQ +"' class='price'>"    + item.PRICE1 + "</"+el+">");
            if ( cols >= 5 ) c.push("<"+el+" id='td5_"+ item.SEQ +"' class='price'>"    + item.PRICE2 + "</"+el+">");
            if ( cols >= 6 ) c.push("<"+el+" id='td6_"+ item.SEQ +"' class='price'>"    + item.PRICE3 + "</"+el+">");
            if ( cols >= 7 ) c.push("<"+el+" id='td7_"+ item.SEQ +"' class='price'>"    + item.PRICE4 + "</"+el+">");
            if ( cols >= 8 ) c.push("<"+el+" id='td8_"+ item.SEQ +"' class='price'>"    + item.PRICE5 + "</"+el+">");
            if ( cols >= 9 ) c.push("<"+el+" id='td9_"+ item.SEQ +"' class='price'>"    + item.PRICE6 + "</"+el+">");
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
