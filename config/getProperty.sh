DIR=$(dirname $(readlink -f $0))
TARGET=$1
KEY=$2
cat $DIR"/"$TARGET".properties" | grep $KEY | head -n +1 | cut -d'=' -f2