// 10XQC JavaScript - Submitting Reports

// Globals
s_datatable = null;
c_data = {};
$(function() {

  // Get the available table columns
  $.getJSON('api/fields.json', function(ajax_data){

    // Make columns data global
    c_data = ajax_data;

    // Populate the "choose columns" modal
    for (var i = 0; i < c_data['columns'].length; i++) {
      var checked = '';
      var ch_class = '';
      if(c_data['default_columns'].indexOf(c_data['columns'][i]) > -1){
        checked = 'checked="checked"';
        ch_class = 'class="table-success"';
      }
      $('#table_columns_modal_table tbody').append('\
        <tr '+ch_class+'>\
          <td class="text-center"><input type="checkbox" name="'+c_data['columns'][i]+'" id="'+c_data['columns'][i]+'" '+checked+'></td>\
          <td><label for="'+c_data['columns'][i]+'">'+c_data['column_long_titles'][i]+'</label></td>\
        </tr>\
      ');
    }

    // Build the basic table for DataTables
    build_datatables_table(c_data['default_columns']);

  });



  // Choose columns modal events
  $('#table_columns_modal_table').on('click', 'tr', function(e){
    if($(this).find('input[type=checkbox]').is(":checked")) {
      $(this).addClass('table-success');
    } else {
      $(this).removeClass('table-success');
    }
  });
  $('.table_columns_modal_apply').click(function(e){
    var columns = [];
    $('#table_columns_modal_table input:checked').each(function(e){
      columns.push($(this).attr('name'));
    });
    build_datatables_table(columns);
    $('#table_columns_modal').modal('hide');
  });
});


function build_datatables_table(columns){
  // Reset
  if (s_datatable != null) {
    s_datatable.destroy();
    $("#sample_browse_table").empty();
    $("#sample_browse_table_wrapper").empty();
    $("#sample_browse_table_wrapper").html('<h1>OVER HERE!</h1><table id="sample_browse_table" class="display compact" cellspacing="0" width="100%"></table>');
  }

  // Get columns for the table
  dt_cols = [];
  for (var i = 0; i < columns.length; i++) {
    var c_title = c_data['column_titles'][ c_data['columns'].indexOf(columns[i]) ];
    dt_cols.push({'title': c_title});
  }

  // Initialise DataTables
  s_datatable = $('#sample_browse_table').DataTable( {
    // "ajax": 'api/browse.json' // static testing file
    columns: dt_cols,
    orderCellsTop: true,
    dom: 'lBfrtip',
    buttons: [{
      text: 'Choose Columns',
      action: function ( e, dt, node, config ) {
        $('#table_columns_modal').modal('show');
      }
    }]
  });

}