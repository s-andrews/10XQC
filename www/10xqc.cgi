#!/usr/bin/perl
use warnings;
use strict;
use CGI;
use FindBin qw($Bin);

# Read config
my $config;

# Make DB connection
my $dbh;

# Direct the action

## Testing.
open (my $fh,$ARGV[0]) or die $!;
read_file($fh);



## Subroutines below here...

sub read_file {

	# This sub takes a file handle to a 10X file and parses
	# out the various parameters we want to record.
	# 
	# It will store the results in the database and return the
	# id of the newly created entry.
	
	# These are the fields we want to get:
	my %variables = (
		mean_reads_per_cell => undef,
		median_genes_per_cell => undef,
		number_of_reads => undef,
		percent_valid_barcodes => undef,
		percent_reads_mapped_to_transcriptome => undef,
		percent_reads_mapped_to_exonic_regions => undef,
		percent_reads_mapped_to_intronic_regions => undef,
		percent_reads_mapped_to_intergenic_regions => undef,
		percent_sequencing_saturation => undef,
		percent_q30_bases_in_barcode => undef,
		percent_q30_bases_in_rna_read => undef,
		percent_q30_bases_in_sample_index => undef,
		percent_q30_bases_in_umi => undef,
		estimated_number_of_cells => undef,
		percentage_fraction_reads_in_cells => undef,
		mean_reads_per_cell => undef,
		total_genes_detected => undef,
		median_umi_counts_per_cell => undef,
		transcriptome => undef,
		chemistry => undef,
		cell_ranger_version => undef,
	);
	
	my ($fh) = @_;

	# Yes, I know this is ugly.
	# Yes, I know you shouldn't parse HTML with regexes.
	# Meh - it works.
	
	while (<$fh>) {
		
		# Number of reads
		if (index($_,'<td>Number of Reads</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{number_of_reads} = $1;
				$variables{number_of_reads} =~ s/,//g;
			}
		}

		# Valid barcodes
		elsif (index($_,'<td>Valid Barcodes</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_valid_barcodes} = $1;
			}
		}

		# Percent reads mapped to transcriptome
		elsif (index($_,'<td>Reads Mapped Confidently to Transcriptome</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_reads_mapped_to_transcriptome} = $1;
			}
		}
		
		# Percent reads mapped to exonic regions
		elsif (index($_,'<td>Reads Mapped Confidently to Exonic Regions</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_reads_mapped_to_exonic_regions} = $1;
			}
		}
		
		# Percent reads mapped to intronic regions
		elsif (index($_,'<td>Reads Mapped Confidently to Intronic Regions</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_reads_mapped_to_intronic_regions} = $1;
			}
		}

		# Percent reads mapped to intronic regions
		elsif (index($_,'<td>Reads Mapped Confidently to Intergenic Regions</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_reads_mapped_to_intergenic_regions} = $1;
			}
		}

		# Sequencing Saturation
		elsif (index($_,'<td>Sequencing Saturation</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_sequencing_saturation} = $1;
			}
		}

		# Q30 Bases in Barcode
		elsif (index($_,'<td>Q30 Bases in Barcode</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_q30_bases_in_barcode} = $1;
			}
		}
		
		# Q30 Bases in RNA Read
		elsif (index($_,'<td>Q30 Bases in RNA Read</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_q30_bases_in_rna_read} = $1;
			}
		}
		
		# Q30 Bases in Sample Index
		elsif (index($_,'<td>Q30 Bases in Sample Index</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_q30_bases_in_sample_index} = $1;
			}
		}

		# Q30 Bases in UMI
		elsif (index($_,'<td>Q30 Bases in UMI</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percent_q30_bases_in_umi} = $1;
			}
		}

		# Estimated Number of Cells
		elsif (index($_,'<td>Estimated Number of Cells</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{estimated_number_of_cells} = $1;
			}
		}

		# Fraction Reads in Cells
		elsif (index($_,'<td>Fraction Reads in Cells</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)\%<\/td>/) {
				$variables{percentage_fraction_reads_in_cells} = $1;
			}
		}

		# Mean Reads per Cell
		elsif (index($_,'<td>Mean Reads per Cell</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{mean_reads_per_cell} = $1;
			}
		}
		
		# Median Genes per Cell
		elsif (index($_,'<td>Median Genes per Cell</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{median_genes_per_cell} = $1;
			}
		}

		# Total Genes Detected
		elsif (index($_,'<td>Total Genes Detected</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{total_genes_detected} = $1;
			}
		}

		# Median UMI Counts per Cell
		elsif (index($_,'<td>Median UMI Counts per Cell</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d,]+)<\/td>/) {
				$variables{median_umi_counts_per_cell} = $1;
			}
		}

		# Cell Ranger Version
		elsif (index($_,'<td>Cell Ranger Version</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([\d\.]+)<\/td>/) {
				$variables{cell_ranger_version} = $1;
			}
		}

		# Chemistry
		elsif (index($_,'<td>Chemistry</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([^<]+)<\/td>/) {
				$variables{chemistry} = $1;
			}
		}
		
		# Transcriptome
		elsif (index($_,'<td>Transcriptome</td>') >=0) {
			$_ = <$fh>;
			if (/<td>([^<]+)<\/td>/) {
				$variables{transcriptome} = $1;
			}
		}
		
	}
	
	foreach my $key (sort keys %variables) {
		if ($variables{$key}) {
			print "$key\t$variables{$key}\n";	
		}
	}

	foreach my $key (sort keys %variables) {
		unless($variables{$key}) {
			print "MISSING: $key\n";	
		}
	}

	
	
}
