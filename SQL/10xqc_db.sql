DROP DATABASE 10xqc;

CREATE DATABASE 10xqc;

USE 10xqc;

CREATE TABLE report (
        id INT AUTO_INCREMENT PRIMARY KEY,
	meta_cell_state VARCHAR(50),
	report_reads_mapped_confidently_to_transcriptome NUMERIC(4,1),
	report_file_hash VARCHAR(100),
	report_q30_bases_in_sample_index NUMERIC(4,1),
	report_q30_bases_in_barcode NUMERIC(4,1),
	report_estimated_number_of_cells INT,
	report_q30_bases_in_rna_read NUMERIC(4,1),
	meta_sequencing_technology VARCHAR(100),
	report_version VARCHAR(50),
	report_median_umi_counts_per_cell INT,
	report_transcriptome VARCHAR(100),
	report_valid_barcodes NUMERIC(4,1),
	report_sample_desc VARCHAR(255),
	report_barcode_rank_plot_data LONGTEXT,
	report_mean_reads_per_cell INT,
	meta_tissue_dissociation VARCHAR(100),
	meta_scrnaseq_method VARCHAR(100),
	report_reads_mapped_confidently_to_intergenic_regions NUMERIC(4,1),
	meta_num_cells_loaded INT,
	report_sample_id VARCHAR(100),
	meta_cell_line_tissue VARCHAR(100),
	report_q30_bases_in_umi NUMERIC(4,2),
	meta_sample_type VARCHAR(100),
	meta_cell_counting_method VARCHAR(100),
	report_fraction_reads_in_cells NUMERIC(4,1),
	report_total_genes_detected INT,
	report_sequencing_saturation NUMERIC(4,1),
	report_chemistry_description VARCHAR(100),
	report_number_of_reads BIGINT,
	meta_species VARCHAR(100),
	report_reads_mapped_confidently_to_intronic_regions NUMERIC(4,1),
	meta_max_cell_size FLOAT,
	report_reads_mapped_confidently_to_exonic_regions NUMERIC(4,1),
	meta_min_cell_size FLOAT,
	report_median_genes_per_cell INT
);

GRANT INSERT,SELECT on 10xqc.* to 10xqcuser@localhost;
FLUSH PRIVILEGES;