import os

path = "public/bin/"
for file in sorted(os.listdir(path)):
    if os.path.isfile(path + file) and file.endswith(".ch8"):
        print('["' + file + '", "' + file + '"],')
