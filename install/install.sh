#!/bin/bash

################################################################################
function getSudoCreds {
	sudo pwd
	return
}

################################################################################
function wgetIf {
	if [ -e $2 ]; then return; fi
	wget $1/$2
}
################################################################################
function installDeb {
	wgetIf $1 $2
	sudo gdebi -n ./$2
}
################################################################################
function installGraphLandscapeDeps {
	sudo apt-get -q -y install gdebi
	sudo apt-get -q -y install build-essential
	sudo apt-get -q -y install apache2
	sudo apt-get -q -y install openssh-server
	sudo apt-get -q -y install node npm
	sudo apt-get -q -y install r-base-core
	sudo apt-get -q -y install r-base-dev

#	sudo apt-get -q -y install xserver-xorg-dev libX11-dev freeglut3 freeglut3-dev
#	installDeb http://download1.rstudio.org rstudio-0.98.1056-amd64.deb 					#optional

	sudo npm install -g nodemon
	sudo npm install -g pm2

	# MongoDB and PostgreSQL 9.3

	sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
	echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" | sudo tee /etc/apt/sources.list.d/mongodb.list

	sudo apt-get install wget ca-certificates
	echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
	wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

	sudo apt-get update

	sudo apt-get -y -q install mongodb-org
	sudo apt-get -y -q install postgresql-9.3 pgadmin3 postgresql-server-dev-9.3

	sudo apt-get -y -q install phppgadmin
	sudo apt-get -y -q install git

	return
}
################################################################################
function configureGraphLandscapeDeps {

	usermod -a -G staff postgres

	# Setup Apache2

	sudo rm /etc/apache2/sites-available/graphlandscape.conf
	cat <<EOF | sudo tee -a /etc/apache2/sites-available/graphlandscape.conf
<Virtualhost *:80>
  ServerName ofl.zapto.org
  ServerAdmin support@mycompany.com
  DirectoryIndex index.html index.phpProxyRequests On

  ProxyPreserveHost On
#  ProxyVia full

  <proxy>
    Order deny,allow
    Allow from all
  </proxy>

  ProxyPreserveHost On
  ProxyRequests off
  ProxyPass 		/phppgadmin 	!
  ProxyPass        	/			http://localhost:8087/
  ProxyPassReverse 	/			http://localhost:8087/
</Virtualhost>
EOF

	sudo cp /etc/apache2/conf.d/phppgadmin /etc/apache2/sites-available/phppgadmin.conf
	sudo sed -i 's/^allow from 127.0.0.0/#allow from 127.0.0.0/' /etc/apache2/sites-available/phppgadmin.conf
	sudo sed -i 's/^# allow from all/allow from all/'  			/etc/apache2/sites-available/phppgadmin.conf
	sudo a2ensite phppgadmin
	sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.bkp

	sudo a2enmod proxy
	sudo a2enmod proxy_http

	sudo a2dissite 000-default
	sudo a2ensite graphlandscape

	sudo service apache2 reload

	# Setup Vis database
	sudo su - postgres -c "psql -c \"CREATE USER akennedy WITH PASSWORD 'akennedy'\""
	sudo su - postgres -c "psql -f ./install/dbs/vis.sql"
	sudo su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE vis TO akennedy;\""


	# Setup Node
	sudo ln -s -f /usr/bin/nodejs /usr/bin/node 
	sudo ln -s -f /usr/bin/nodejs /usr/sbin/node

	# Setup R 

	sudo sh -c 'echo "R_HOME=\"/usr/lib/R\"" >> /etc/environment'
	sudo /etc/init.d/postgresql restart 9.3

	sudo sh -c 'echo "/usr/lib/R/lib" > /etc/ld.so.conf.d/R.conf'
	sudo ln -s /usr/share/R/include /usr/lib/R/include
	sudo ldconfig

	# Install PL/R
	sudo usermod -a -G staff postgres

	# Get PL/R from git repo
	mkdir ~/git
	pushd ~/git
	git clone https://github.com/jconway/plr.git
	popd

	sudo su <<EOF
	pushd ~/git/plr/
	USE_PGXS=1 make
	USE_PGXS=1 make install
	popd
EOF

	sudo su - postgres -c "psql template1 -f /usr/share/postgresql/9.3/extension/plr.sql"
	sudo su - postgres -c "psql vis       -f /usr/share/postgresql/9.3/extension/plr.sql"
	psql vis -c "CREATE TABLE plr_modules (modseq int4,modsrc text);"

	sudo su - postgres -c "R -q -e \"install.packages('entropy', dependencies=TRUE,repos = 'http://cran.csiro.au/')\""
	psql vis -c "INSERT INTO plr_modules VALUES (0, 'library(entropy)' );"

	sudo su - postgres -c "R -q -e \"install.packages('iterators', dependencies=TRUE,repos = 'http://cran.csiro.au/')\""
	psql vis -c "INSERT INTO plr_modules VALUES (1, 'library(iterators)' );"

	sudo su - postgres -c "R -q -e \"install.packages('doMC', dependencies=TRUE,repos = 'http://cran.csiro.au/')\""
	psql vis -c "INSERT INTO plr_modules VALUES (2, 'library(doMC)' );"


	psql vis -c "SELECT * FROM reload_plr_modules();"
	psql vis -c "SELECT * FROM plr_modules;"

	# Install GL Functions dependant on PL/R

	psql vis -f ./install/dbs/FunctionPlan.sql
	psql vis -f ./install/dbs/FunctionFrnt.sql
	psql vis -f ./install/dbs/FunctionSide.sql

}
################################################################################
function installNodeService {


cat <<EOF | sudo tee -a /etc/init/grls.conf

description "Graph Landscape node.js server"
author      "ajk - andrew.j.kennedy@gmail.com"

# used to be: start on startup
# until we found some mounts weren't ready yet while booting:
start on started mountall
stop on shutdown

# Automatically Respawn:
respawn
respawn limit 99 5

script
    # Not sure why \$HOME is needed, but we found that it is:
    export HOME="/root"

    exec /usr/sbin/node $HOME/git/graphlandscape/server.js 8087  >> /var/log/grls.log 2>&1
end script

post-start script
   # Optionally put a script here that will notifiy you node has (re)started
   # /root/bin/hoptoad.sh "node.js has started!"
end script
EOF

	sudo service grls start

}

################################################################################
################################################################################


getSudoCreds
installGraphLandscapeDeps
configureGraphLandscapeDeps
installNodeService

exit
################################################################################
################################################################################
