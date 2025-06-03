#!/usr/bin/env python3

import os
import sys

def extract_rar():
    try:
        import rarfile
        with rarfile.RarFile('user_input_files/IndividGIS.rar') as rf:
            rf.extractall('.')
            print('Successfully extracted RAR archive using rarfile')
            return True
    except ImportError:
        print('rarfile not available, trying other methods...')
    except Exception as e:
        print(f'Error with rarfile: {e}')
    
    # Try with patool
    try:
        import patool
        patool.extract_archive('user_input_files/IndividGIS.rar', outdir='.')
        print('Successfully extracted RAR archive using patool')
        return True
    except ImportError:
        print('patool not available')
    except Exception as e:
        print(f'Error with patool: {e}')
    
    # Try with system 7z
    try:
        result = os.system('7z x user_input_files/IndividGIS.rar')
        if result == 0:
            print('Successfully extracted RAR archive using 7z')
            return True
    except Exception as e:
        print(f'Error with 7z: {e}')
    
    return False

if __name__ == "__main__":
    if not extract_rar():
        print("Failed to extract RAR archive with all methods")
        sys.exit(1)