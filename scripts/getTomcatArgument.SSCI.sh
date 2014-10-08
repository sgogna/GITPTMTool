TARGET=$1
ARG=$2
DIR=$(dirname $0)
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`

PID=`$DIR/getTomcatPID.$PTM_ENV.sh $TARGET`
ps $PID | awk -v arg="$ARG" -- 'BEGIN{FS=" ";}{for(i = 1; i <= NF; i++) { if(index($i,arg)){print $i; break;}; } }'
