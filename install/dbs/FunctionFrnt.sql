--	sudo su postgres -c "psql vis"
--	\i /home/akennedy/uni/PROJECT/dbs/NotesFuncFrnt.sql
/*

FRONT VIEW - PCP

*/
\set sqltext1 'SELECT NODES, EDGES, DENSITY, COMPONENTS, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, LOOPS, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext1_q '\'' :sqltext1 '\''
\set sqltext2 'SELECT 1'
\set sqltext2_q '\'' :sqltext1 '\''

\set sqltext3 'SELECT NODES, EDGES, DENSITY, MINDEG, MAXDEG, AVGDEG, CLUSTERING_COEFFICIENT AS CLSTR_CO, AVGSHPATH, DIAMETER, FAMILY FROM GRAPHS WHERE ID < 50'
\set sqltext3_q '\'' :sqltext3 '\''


/* frnt View */

create or replace function r_frntview_c(sql IN text)
	returns text[]
as $$
ret <<- pg.spi.exec(sub("WHERE.*","WHERE ID = 0",sql))
return( colnames(ret) ) 
$$ LANGUAGE 'plr';

create or replace function r_frntview_d(sql IN text)
	returns text[]
as $$
ret <<- pg.spi.exec(sub("FROM",",ID FROM",sql))
return(ret)
$$ LANGUAGE 'plr';

create or replace function r_frntview_a(sql IN text)
	returns setof text[]
as $$

SELECT D
FROM(SELECT 1 AS R, r_frntview_c(sql) AS D
	UNION
	 SELECT 2 AS R, r_frntview_d(sql) AS D) T
ORDER BY R

$$ LANGUAGE 'sql';

--select * from r_frntview_a(:sqltext1_q);

select * from r_frntview_a(:sqltext1_q);

/**/
