<?php

if(isset($_POST)){
  echo '<pre>'.json_encode($_POST, JSON_PRETTY_PRINT).'</pre>';
  // mock_browse_json();
  // mock_umi_plotdata();
}


function mock_browse_json(){
  $keys = array(
    'meta_species',
    'meta_sequencing_technology',
    'meta_num_cells_loaded',
    'meta_cell_counting_method',
    'meta_cell_state',
    'meta_sample_type',
    'meta_cell_line_tissue',
    'meta_tissue_dissociation',
    'meta_min_cell_size',
    'meta_max_cell_size',
    'meta_scrnaseq_method',
    'report_file_hash',
    'report_sample_id',
    'report_sample_desc',
    'report_chemistry_description',
    'report_transcriptome',
    'report_version',
    'report_estimated_number_of_cells',
    'report_mean_reads_per_cell',
    'report_median_genes_per_cell',
    'report_number_of_reads',
    'report_valid_barcodes',
    'report_reads_mapped_confidently_to_transcriptome',
    'report_reads_mapped_confidently_to_exonic_regions',
    'report_reads_mapped_confidently_to_intronic_regions',
    'report_reads_mapped_confidently_to_intergenic_regions',
    'report_sequencing_saturation',
    'report_q30_bases_in_barcode',
    'report_q30_bases_in_rna_read',
    'report_q30_bases_in_sample_index',
    'report_q30_bases_in_umi',
    'report_fraction_reads_in_cells',
    'report_total_genes_detected',
    'report_median_umi_counts_per_cell'
  );
  $data = array();
  foreach($_POST as $key => $var){
    $idx = preg_match('/_(\d+)$/', $key, $matches);
    $fname = preg_replace('/_\d+$/', '', $key);
    if(in_array($fname, $keys)){
      $data[$matches[1]][$fname] = $var;
    }
  }
  foreach($data as $idx => $d){
    $data[$idx]['DT_RowId'] = $d['report_file_hash'];
  }
  echo '<pre>'.json_encode($data, JSON_PRETTY_PRINT).'</pre>';
}


function mock_umi_plotdata(){
  $data = array();
  foreach($_POST as $key => $var){
    $idx = preg_match('/_(\d+)$/', $key, $matches);
    $fname = preg_replace('/_\d+$/', '', $key);
    if($fname == 'report_barcode_rank_plot_data'){
      $data[] = [$_POST['report_sample_id_'.$idx], $var];
    }
  }
  echo '<pre>'.json_encode($data, JSON_PRETTY_PRINT).'</pre>';
}