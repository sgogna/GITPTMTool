 #!/bin/bash
 DIR=$(dirname $(readlink -f $0))
 TARGET=$1
 GC_NAME=$2
 gclog=`$DIR/../config/getProperty.sh $TARGET $GC_NAME`
 echo $gclog