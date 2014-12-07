graphlandscape
==============
==============

Technical Notes
==============


The GraphLandscape implementation uses the traditional client-server model because the algorithms used to navigate through the aggregate views of both the data and the dimensions are expensive.

An Apche2 web server acts as a proxy for a service running node.js.
The reason for this is that Apache2 can authenticate to a Kerberos server (but the is not implemented).

Node.js acts as the application server.  With the authentication functionality switch off, this is a very simple layer, passing requests through to the database server and serving the static documents.

The database server the Postgesql.  The reason for this is that we can use R functionality (and in fact  even raw C) inside the database functions.  This opens up a lot of libraries to be exploited by the user (beyond was is built by this system).  Also R has an in-built library to enable the execution of its functions over multiple cores.

Another advantage of R is that when passing the data back it uses a very sparse data representation which will save bandwidth over the network.

On the client side the work is done with HTML5 and javascript.

Fuctionality
==============

There are 4 views of the data that are rendered from 3 separate database calls.

The primary view (Front View) is a PCP.  This is a direct rendering of an arbitrary SQL statement.

SQL can already ask some sophisticated questions of the data, so allowing the users the full functionality of this very mature tool makes sense.

Directly dependant on the Front View (it uses the same database call) is the Section View.  This consists of n-1 scatter-plots (SPs)  that are located under each dimension in the PCP.  The user selects the dimension they wish to examine and 2D scatter-plots of this dimension against all the others are displayed.

It the PCP is the Front View of the data, then if we view the data from above we will see the Plan View.  A naive rendering would not be useful, so the question becomes: what would a meaningful aggregation of the dimensions of dataset look like?  Given the sparseness of the graph (n nodes) it was decided that a Forced Layout (FL) that describes the 'relatedness' of each dimension would be the most useful.  To do the we calculated the Global Correlation Coefficient (GCC) to give us a useful number between 0 and 1 which was then used to set the initial distance and force for the FL simulation.  The user can then see the interesting dimensions clustered in the middle and the non-relevant dimension excluded on the periphery.  The user can also see the arbitrary path through the relationship mesh that the PCP renders as it is hi-lighted in red. 

The final view is the Side View.  Here we are examining the aggregate view of the dataset itself.  The obvious candidate is a Multi-Dimensional Scale (MDS).  There are two options available to the user: a set of cheap, pre calculated values; and the option to calculate the MDS on the fly using only  the data and dimensions in the current query.  Calculation the MDS is the most expensive operation in the system and optimising this (perhaps with using raw C inside the Postgres function and/or utilising GPU computing).

The interactive elements happen beyond the initial SQL query.

Firstly the PCP allows for “brushing” of the dataset to hi-light areas if interest to the user.  When this is done the other views that render the dataset (Section and Side views) also hi-light the same data points. If the “MDS calculate” option is enabled the user can get a new rendering of the MDS based on the subset of data.

Dimensions on the PCP can be re-ordered to expose relations of interest more readily.   When re-ordered the corresponding scatter-plot also moves as expected and the red path through the Plan View also updates.

Dimensions on the PCP can be deleted and the corresponding scatter-plot and node in the Plan View also get deleted.   If the “MDS calculate” option is enabled the user can get a new rendering of the MDS based on the reduced dimensions.  

The brushing functionality also works in reverse, from the MDS onto the PCP and Sps.

The user can make multiple arbitrary queries to the database and each of these are saved in their browser session so that the can easily switch between then.

Finally the user has the option to extract the IDs of the dataset they have hi-lighted and save it to a text file with an annotation.


Notes – useless javascipt
==================

One of the original ideas with the mid-year re-factoring was to use the mature d3.parcoords.js script as the basis for all the others.  It turns out that I was unable to do this and so these files are not really used:
d3.forcedlayout.js
d3.multidscale.js
d3.scatterplots.js
The actual functionality is in:
d3.forcedlayout2.js
d3.multidscale2.js
d3.scatterplots2.js

Notes – Postgres Funtions
===================

R returns the dataset as a sparse representation just including the data in a 2D matrix.
Since the 




