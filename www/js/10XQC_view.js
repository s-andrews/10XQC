// 10XQC JavaScript - Homepage

// Globals
s_datatable = null;
default_columns = [];
c_data = {};
t_data = {};

// API URLs
table_api = '10xqc.cgi';
fields_api = '10xqc.cgi?action=fields';

// // Testing API URLs
// table_api = 'test/browse.json';
// fields_api = 'test/fields_cgi.json';

$(function() {

  // Get the available table columns
  $.getJSON(fields_api, function(ajax_data){

    // Make columns data global
    c_data = ajax_data['columns'];
    for (var i = 0; i < c_data.length; i++) {
      // Skip the "id" field
      if(c_data[i][0] == 'id'){ continue; }
      // Populate the "choose columns" modal
      var checked = '';
      var ch_class = '';
      if(c_data[i][3] > 0){
        checked = 'checked="checked"';
        ch_class = 'class="table-success"';
        default_columns.push(c_data[i]);
      }
      $('#table_columns_modal_table tbody').append('\
        <tr '+ch_class+'>\
          <td class="text-center"><input type="checkbox" name="'+c_data[i][0]+'" id="'+c_data[i][0]+'" '+checked+'></td>\
          <td><label for="'+c_data[i][0]+'">'+c_data[i][2]+'</label></td>\
        </tr>\
      ');
      // Populate the UMI plot label dropdown and scatter label dropdown
      if(c_data[i][0] !== 'report_file_hash' && c_data[i][0] !== 'id'){
        $('#table_plot_modal_label, #umi_plot_modal_cat_1').append('<option value="'+c_data[i][0]+'">'+c_data[i][1]+'</option>');
      }
      // Populate the scatter plot dropdowns if numeric
      if(c_data[i][4]){
        $('#table_plot_modal_yaxis, #table_plot_modal_xaxis').append('<option value="'+c_data[i][0]+'">'+c_data[i][1]+'</option>');
      }
    }

    // Get data for the table
    $.getJSON(table_api, function(ajax_data) {
      t_data = ajax_data['data'];
      $('.num_reports').text(t_data.length);
      // Build the basic table for DataTables
      build_datatables_table(default_columns);
    });

  });



  // Buttons to show or hide all table columns
  $('.showhide_all_columns_btn').click(function(e){
    $('#table_columns_modal_table input[type=checkbox]').prop('checked', $(this).data('checked'));
    if($(this).data('checked')){
      $('#table_columns_modal_table tbody tr').addClass('table-success');
    } else {
      $('#table_columns_modal_table tbody tr').removeClass('table-success');
    }
  });
  // Clicking on checkboxes in table column modal
  $('#table_columns_modal_table').on('click', 'tr', function(e){
    if($(this).find('input[type=checkbox]').is(":checked")) {
      $(this).addClass('table-success');
    } else {
      $(this).removeClass('table-success');
    }
  });
  // Button to apply table column choices
  $('.table_columns_modal_apply').click(function(e){
    var columns = [];
    $('#table_columns_modal_table input:checked').each(function(e){
      for (var i = 0; i < c_data.length; i++) {
        if(c_data[i][0] == $(this).attr('name')){
          columns.push(c_data[i]);
        }
      }
    });
    // Reset the table
    if (s_datatable != null) {
      s_datatable.destroy();
      $("#sample_browse_table").empty();
      $("#sample_browse_table").html('<tbody><tr><td><div class="alert alert-info">Loading..</div></td></tr></tbody>');
    }
    // Hide the modal
    $('#table_columns_modal').modal('hide');
    // Build the new table with new columns
    build_datatables_table(columns);
  });
});


function build_datatables_table(columns){
  try {
    // Get columns for the table
    dt_cols = [];
    for (var i = 0; i < columns.length; i++) {
      dt_cols.push({'title': columns[i][1], 'name': columns[i][1], 'data':columns[i][0], 'type': 'num'});
    }

    // Initialise DataTables
    s_datatable = $('#sample_browse_table').DataTable( {
      data: t_data,
      columns: dt_cols,
      scrollX: '100%',
      dom: 'lBfrtip',
      lengthMenu: [
        [10, 50, 100, -1],
        [10, 50, 100, "All"]
      ],
      buttons: [
        {
          text: 'Choose Columns',
          action: function ( e, dt, node, config ) {
            $('#table_columns_modal').modal('show');
          }
        },
        {
          text: 'Download Data',
          action: function ( e, dt, node, config ) {
            try {
              var datastring = '';
              var keys = [];
              for(i=0; i<t_data.length; i++){
                if(keys.length==0){
                  keys = Object.keys(t_data[i]);
                  for(j=0;j<keys.length;j++){
                    var key = keys[j];
                    if(key == 'DT_RowId'){ key = 'id'; }
                    for(k=0;k<c_data.length;k++){
                      if(c_data[k][0] == key){
                        datastring += c_data[k][2]+"\t";
                      }
                    }
                  }
                  datastring += "\n";
                }
                for(j=0;j<keys.length;j++){
                  datastring += t_data[i][keys[j]]+"\t";
                }
                datastring += "\n";
              }
              var blob = new Blob([datastring], {type: "text/plain;charset=utf-8"});
              saveAs(blob, '10xqc.tsv');
            } catch(e){
              alert("Error - apologies, something broke.");
              console.error(e);
            }
          }
        }
      ]
    });
  } catch(e){
    $("#sample_browse_table").html('<tbody><tr><td><div class="alert alert-danger">Error - could not load table.</div></td></tr></tbody>');
    console.error(e);
    console.debug('columns', columns);
    console.debug('t_data', t_data);
    console.debug('dt_cols', dt_cols);
  }
}