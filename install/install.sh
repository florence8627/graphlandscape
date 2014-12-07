#!/bin/bash


################################################################################
function getSudoCreds {

	sudo pwd
	return
}
################################################################################
function installStuffForUni {
	sudo apt-get -q -y install apache2
	sudo apt-get -q -y install openssh-server

	sudo apt-get -q -y install node npm
	sudo apt-get -q -y install r-base-core
	sudo apt-get -q -y install r-base-dev
	sudo apt-get -q -y install xserver-xorg-dev libX11-dev freeglut3 freeglut3-dev
	installDeb http://download1.rstudio.org rstudio-0.98.1056-amd64.deb
	sudo npm install -g nodemon

	# MongoDB and PostgreSQL

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

	sudo cp /etc/apache2/conf.d/phppgadmin /etc/apache2/sites-available/phppgadmin.conf
	sudo sed -i 's/^allow from 127.0.0.0/#allow from 127.0.0.0/' /etc/apache2/sites-available/phppgadmin.conf
	sudo sed -i 's/^# allow from all/allow from all/'  			/etc/apache2/sites-available/phppgadmin.conf
	sudo a2ensite phppgadmin
	sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.bkp

	sudo a2enmod proxy

	sudo a2enmod proxy_http

	sudo a2dissite 000-default
	sudo a2ensite graphlandscape

function configureStuffForUni {

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

	sudo service apache2 reload

	return
	# Setup Vis database
	sudo su - postgres -c "psql -c \"CREATE USER akennedy WITH PASSWORD 'akennedy'\""
	sudo su - postgres -c "psql -f /home/akennedy/uni/PROJECT/dbs/bkp/vis.sql"
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


	sudo su <<!
	pushd ~/git/plr/
	USE_PGXS=1 make
	USE_PGXS=1 make install
	popd

!
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

	psql vis -f /home/akennedy/uni/PROJECT/dbs/NotesFuncPlan.sql
	psql vis -f /home/akennedy/uni/PROJECT/dbs/NotesFuncFrnt.sql
	psql vis -f /home/akennedy/uni/PROJECT/dbs/NotesFuncSide.sql

}
################################################################################
function installNodeService {

/etc/init/yourprogram.conf

}

################################################################################
################################################################################
################################################################################

#http://howtoubuntu.org/things-to-do-after-installing-ubuntu-14-10-utopic-unicorn

getSudoCreds

#	installChrome
#	installSublimeText2
#	configureSublimeText2
#	addAptRepositories
#	aptUpdateUpgrade
#	installGetDeb
#	installEssentials
#	installTerminator
#	configureTerminator
#	installGoogleChat
#	installMoreStuff
#	installSteam
#	installStuffForUni
	configureStuffForUni

#	cleanUp

exit
################################################################################
################################################################################
################################################################################

# Part 1

sed -i "/^# deb .*partner/ s/^# //" /etc/apt/sources.list
#apt-get update



# Part 2

#echo "Deleting Downloads" &&
#rm -f getdeb-repository_0.1-1~getdeb1_all.deb &&
#rm -f playdeb_0.3-1~getdeb1_all.deb

# Part 3
sudo add-apt-repository -y ppa:videolan/stable-daily
sudo add-apt-repository -y ppa:otto-kesselgulasch/gimp
sudo add-apt-repository -y ppa:videolan/stable-daily
sudo add-apt-repository -y ppa:gnome3-team/gnome3

sudo add-apt-repository -y ppa:webupd8team/java
sudo add-apt-repository -y ppa:webupd8team/y-ppa-manager


echo 'deb http://download.videolan.org/pub/debian/stable/ /' | sudo tee -a /etc/apt/sources.list.d/libdvdcss.list &&
echo 'deb-src http://download.videolan.org/pub/debian/stable/ /' | sudo tee -a /etc/apt/sources.list.d/libdvdcss.list &&
wget -O - http://download.videolan.org/pub/debian/videolan-apt.asc|sudo apt-key add -


# Part 4
sudo apt-get update

# Part 5
sudo apt-get upgrade

# Part 6
sudo apt-get dist-upgrade


# Part 7
sudo apt-get install synaptic vlc gimp gimp-data gimp-plugin-registry gimp-data-extras y-ppa-manager bleachbit openjdk-7-jre oracle-java8-installer flashplugin-installer unace unrar zip unzip p7zip-full p7zip-rar sharutils rar uudeview mpack arj cabextract file-roller libxine1-ffmpeg mencoder flac faac faad sox ffmpeg2theora libmpeg2-4 uudeview libmpeg3-1 mpeg3-utils mpegdemux liba52-dev mpeg2dec vorbis-tools id3v2 mpg321 mpg123 libflac++6 totem-mozilla icedax lame libmad0 libjpeg-progs libdvdcss2 libdvdread4 libdvdnav4 libswscale-extra-2 ubuntu-restricted-extras ubuntu-wallpapers*

# Part 8

# Install addional Drivers

# http://www.yourownlinux.com/2014/09/how-to-install-amd-catalyst-14-30-graphics-driver-in-linux.html

#http://www.yourownlinux.com/2014/09/how-to-install-amd-catalyst-14-30-graphics-driver-in-linux.html

# For Ubuntu LightDM [DEFAULT]

sudo service lightdm stop
sudo ./amd-driver-installer*.run
sudo service lightdm start

# Part 9 

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&
sudo dpkg -i google-chrome-stable_current_amd64.deb &&
#rm -f google-chrome-stable_current_amd64.deb

#Part 10

echo "Cleaning Up" &&
sudo apt-get -f install &&
sudo apt-get autoremove &&
sudo apt-get -y autoclean &&
sudo apt-get -y clean


# http://scienceblogs.com/gregladen/2014/04/24/10-or-20-things-to-do-after-installing-ubuntu-14-04-trusty-tahr/

#sudo dpkg -i skype-ubuntu-precise_4.3.0.37-1_i386.deb

sudo apt-get install skype
sudo apt-get install gtk2-engines-murrine:i386 gtk2-engines-pixbuf:i386
sudo apt-get install sni-qt:i386


gsettings set com.canonical.Unity.Lenses disabled-scopes "['more_suggestions-amazon.scope', 'more_suggestions-u1ms.scope', 'more_suggestions-populartracks.scope', 'music-musicstore.scope', 'more_suggestions-ebay.scope', 'more_suggestions-ubuntushop.scope', 'more_suggestions-skimlinks.scope']"

#Disable online searches from dash with
wget -q -O – https://fixubuntu.com/fixubuntu.sh | bash



sudo add-apt-repository ppa:linrunner/tlp
sudo apt-get update
sudo apt-get install tlp tlp-rdw
sudo tlp start

gsettings set com.canonical.desktop.interface scrollbar-mode normal
gsettings set com.canonical.indicator.session show-real-name-on-panel true


#	http://itsfoss.com/things-to-do-after-installing-ubuntu-14-04/

wget http://download.skype.com/linux/skype-ubuntu-precise_4.2.0.13-1_i386.deb




sudo apt-get -f install &&
sudo apt-get autoremove &&
sudo apt-get -y autoclean &&
sudo apt-get -y clean

#	Sublime Text 2
sudo add-apt-repository ppa:webupd8team/sublime-text-2
sudo apt-get update

sudo apt-get remove sublime-text*
sudo apt-get install sublime-text



#	Terminator
#	https://drive.google.com/folderview?id=0BzZNCgKvEkQYZDBNTm1HWThOaEU&usp=drive_web#list

https://jessies.googlecode.com/files/org.jessies.terminator_27.9.6921_amd64.deb


