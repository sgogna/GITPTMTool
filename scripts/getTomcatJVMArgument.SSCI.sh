DIR=$(dirname $0)
SERVER=`uname -n`

PTM_ENV=`$DIR/../config/getProperty.sh tools ptm.env.$SERVER`
$DIR/getTomcatArgument.$PTM_ENV.sh $1 $2 | cut -d':' -f2
