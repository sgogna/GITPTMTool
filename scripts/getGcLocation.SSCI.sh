 #!/bin/bash
 TARGET=$1
 DIR=$(dirname $(readlink -f $0))
 SERVER=`uname -n`

 PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`
 gclog=`"$DIR"/getTomcatJVMArgument.$PTM_ENV.sh $TARGET loggc`
 echo $gclog