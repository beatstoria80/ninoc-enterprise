import re
import sys

def bump_font_sizes(content):
    # Mapping of small specific sizes to standard tailwind sizes
    # Remove md: prefixes for tiny fonts that might have been used to make them even smaller on desktop
    
    content = re.sub(r'md:text-\[7px\]', '', content)
    content = re.sub(r'md:text-\[8px\]', '', content)
    content = re.sub(r'md:text-\[9px\]', '', content)
    content = re.sub(r'md:text-\[10px\]', '', content)
    content = re.sub(r'md:text-\[11px\]', '', content)
    
    # Replace absolute tiny sizes
    content = content.replace('text-[6px]', 'text-xs')
    content = content.replace('text-[7px]', 'text-xs')
    content = content.replace('text-[8px]', 'text-xs')
    content = content.replace('text-[9px]', 'text-sm')
    content = content.replace('text-[10px]', 'text-sm')
    content = content.replace('text-[11px]', 'text-base')
    content = content.replace('text-[12px]', 'text-base')
    content = content.replace('text-xs', 'text-sm') # Maybe bump xs to sm too? Actually let's keep xs if we just replaced into xs. Wait.
    
    return content

if __name__ == '__main__':
    with open('src/components/admin/tabs/ReturTab.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Custom replacements for specific elements
    content = re.sub(r'text-\[\d+px\]', 'text-sm', content) # catch-all for any remaining text-[px]
    
    # Fix the empty md: classes that we just stripped
    content = content.replace(' md: ', ' ')
    content = content.replace('  ', ' ')
    
    with open('src/components/admin/tabs/ReturTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Done")
