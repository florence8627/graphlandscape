--	sudo su postgres -c "psql vis"
--	\i /home/akennedy/uni/PROJECT/dbs/NotesFuncPlan.sql
/*

PLAN VIEW - FL

*/
\set sqltext1 'SELECT NODES, EDGES, DENSITY, COMPONENTS, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, LOOPS, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext1_q '\'' :sqltext1 '\''
\set sqltext2 'SELECT 1'
\set sqltext2_q '\'' :sqltext1 '\''

\set sqltext3 'SELECT NODES, EDGES, DENSITY, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext3_q '\'' :sqltext3 '\''


create or replace function r_planview_c(sql IN text) returns text[]
as $$
c('source','target','value')
$$ LANGUAGE 'plr';


create or replace function r_planview_d(sql IN text) returns text[]
as $$

require(iterators)
require(entropy)
require(doMC)
registerDoMC(cores=4)

dataset <<- pg.spi.exec(sql)
cols <- colnames(dataset)
c <- length(cols) * (length(cols)-1) * 0.5

#	Put the dataset into 5% probability bins
bins = NULL
for (i in seq(1, length(cols)) ) {
	b1 <- c(-Inf,unique(quantile(as.numeric(dataset[,i]),probs = seq(0, 1, 0.05), na.rm=TRUE, names = FALSE)),Inf)
	d1 <- .bincode(as.numeric(dataset[,i]), sort(b1), right = TRUE, include.lowest = FALSE)
	bins = cbind(bins,d1)
}

# create some empty vectors
source <- character(c)
target <- character(c)
value  <- numeric(c)
n = 1

for (i in seq(1, length(cols)-1) ) {
	for (j in seq(i+1, length(cols)) ) {

		d <- data.frame(bins[,i],bins[,j]);
		p <- tapply(rep(1, nrow(d)), d, sum) / nrow(d); # Generate a probability matrix
		p[is.na(p)] = 0; 								# Replace possible NAs with 0s

		MI = mi.plugin(p);
		GCC = (1 - exp(-2*MI))^(1/2);
	
		source[n] <- cols[i];
		target[n] <- cols[j];
		value[n]  <- GCC;

		n = n + 1;
	}
}

ret <- data.frame(source, target, value, stringsAsFactors=FALSE)

ret

$$ LANGUAGE 'plr';

create or replace function r_planview_a(sql IN text) returns setof text[]
as $$

SELECT D
FROM(SELECT 1 AS R, r_planview_c(sql) AS D
	 UNION
	 SELECT 2 AS R, r_planview_d(sql) AS D) T
ORDER BY R

$$ LANGUAGE 'sql';


--select * from r_planview_a(:sqltext1_q);
