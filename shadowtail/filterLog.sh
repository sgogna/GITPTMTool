DIR=$(dirname $(readlink -f $0))

File=$1
Start=$2
Stop=$3

head -n 1 $File 
cat $File | awk -v start="$Start" -v end="$Stop" -- 'BEGIN{FS=" "}{if ($1" "$2 >= start && $1" "$2 <= end){print $0}}'
