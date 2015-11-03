--	sudo su postgres -c "psql vis"
--	\i /home/akennedy/uni/PROJECT/dbs/NotesFuncSide.sql
/*

SIDE VIEWS - MDS

*/
\set sqltext1 'SELECT NODES, EDGES, DENSITY, COMPONENTS, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, LOOPS, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext1_q '\'' :sqltext1 '\''
\set sqltext2 'SELECT 1'
\set sqltext2_q '\'' :sqltext1 '\''

\set sqltext3 'SELECT NODES, EDGES, DENSITY, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext3_q '\'' :sqltext3 '\''


/* sideview Ver 1*/

create or replace function r_sideview_c(sql IN text)
	returns text[]
as $$

ret <- c('id','setid','mapx','mapy')
return( ret ) 
$$ LANGUAGE 'plr';


create or replace function r_sideview_d1(sql IN text)
	returns text[]
as $$

#require(smacof)
require(doMC)
registerDoMC(cores=4)

dataset <<- pg.spi.exec(sub("SELECT","SELECT ID, SETID",sql))
   id <- dataset[,1]
setid <- dataset[,2]

n <- scale(dataset[,-2]) # normalise dataset

d <- dist(n) # get the distance (ignore 'id' and 'setid')

mds <- cmdscale(d, eig = TRUE, k = 2)
#mds <- smacofSym(d, ndim = 2)

xmap <- mds$points[, 1]
ymap <- mds$points[, 2]

ret = cbind(id,setid,xmap,ymap)
return(ret)

$$ LANGUAGE 'plr';

create or replace function r_sideview_a1(sql IN text)
	returns setof text[]
as $$

SELECT D
FROM(SELECT 1 AS R, r_sideview_c(sql) AS D
	 UNION
	 SELECT 2 AS R, r_sideview_d1(sql) AS D) T
ORDER BY R

$$ LANGUAGE 'sql';

/* SIDE VIEW Ver 2 */

create or replace function r_sideview_d2(sql IN text)
	returns text[]
as $$

ret <<- pg.spi.exec(sub(".*FROM","SELECT ID, SETID, MAPX, MAPY FROM",sql))

ret

$$ LANGUAGE 'plr';

create or replace function r_sideview_a2(sql IN text)
	returns setof text[]
as $$

SELECT D
FROM(SELECT 1 AS R, r_sideview_c(sql) AS D
	 UNION
	 SELECT 2 AS R, r_sideview_d2(sql) AS D) T
ORDER BY R

$$ LANGUAGE 'sql';

select * from r_sideview_a2(:sqltext1_q);
/**/
