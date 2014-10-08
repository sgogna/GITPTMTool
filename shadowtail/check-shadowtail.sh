host=`uname -n`
user=`whoami`
processId=`head -n 1 pid/$host.$user.$1.pid`
echo "shadowtail running? PID: $processId" 

