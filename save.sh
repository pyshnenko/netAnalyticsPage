#!/bin/bash

if [[ -z "$1" ]]
then
  echo "no folder"
else
  while true; do
    read -r -p "Do you need to build project? (Y/n) " answer
    case $answer in
        [Yy]* ) npm run build; break;;
        [Nn]* ) break;;
        * ) echo "Please answer Y or N.";;
    esac
  done
  
  while true; do
    read -r -p "do you need to update access on build folder? (Y) or (N) " answer
    case $answer in
        [Yy]* ) chmod 777 -R build; break;;
        [Nn]* ) break;;
        * ) echo "Please answer Y or N.";;
    esac
  done
  
  while true; do
    read -r -p "You need to edit the index.html file. If the file has been edited, press (Y). If you need to stop the script, press (N) " answer
    case $answer in
        [Yy]* ) break;;
        [Nn]* ) exit $?;;
        * ) echo "Please answer Y or N.";;
    esac
  done
  if [[ $1 == "build" ]]
  then
    if [[ -d "$1" ]]
    then
      echo "remove build from nginx"
      sudo rm -r /var/www/html/build
      echo "copy list to nginx/build"
      sudo cp -r build /var/www/html
    else
      echo "not build"
    fi
  else
    if [[ -d "build" ]]
    then
      echo "build is here"
      echo "delete folder $1"
      sudo rm -r $1
      echo "rename build -> $1"
      sudo mv build $1
      if [[ -d "/var/www/html/$1" ]]
      then
        echo "remove $1 from nginx"
        sudo rm -r /var/www/html/$1
      fi
      echo "copy list to nginx/$1"
      sudo cp -r $1 /var/www/html
    else
      if [[ -d "$1" ]]
      then
        if [[ -d "/var/www/html/$1" ]]
        then
          echo "remove $1 from nginx"
          sudo rm -r /var/www/html/$1
        fi
        echo "copy list to nginx/$1"
        sudo cp -r $1 /var/www/html
      else
        echo "ERROR: NOTHING TO SAVE"
      fi
    fi
  fi
  while true; do
    read -r -p "Do you need to commit and push to git? (Y/n) " answer
    case $answer in
        [Yy]* ) 
          git add .
          if [[ -z "$2" ]]
          then
            myvar=$(date '+%d-%m-%Y_%H-%M-%S')
            git commit -m "$myvar"
          else
            git commit -m "$2"
          fi
          git push
          break
          ;;
        [Nn]* ) break;;
        * ) echo "Please answer Y or N.";;
    esac
  done
  echo "success"
fi