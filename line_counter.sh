#!/usr/bin/env bash
# loc.sh — count "actual" LOC recursively (non-blank, non-comment),
# while skipping common config files and junk/vendor/build dirs.

set -euo pipefail

ROOT="${1:-.}"
[[ -d "$ROOT" ]] || { echo "Error: '$ROOT' is not a directory" >&2; exit 1; }

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# Skip common non-source directories
find_code_files() {
  find "$ROOT" \
    \( -type d \( \
      -name .git -o -name .hg -o -name .svn -o \
      -name node_modules -o -name vendor -o -name dist -o -name build -o -name out -o \
      -name target -o -name .venv -o -name venv -o -name __pycache__ -o \
      -name .tox -o -name .mypy_cache -o -name .pytest_cache -o \
      -name .idea -o -name .vscode -o -name coverage -o \
      -name .next -o -name .nuxt -o -name .svelte-kit -o -name .cache -o \
      -name .turbo -o -name .gradle -o -name .terraform -o -name .dart_tool \
    \) -prune \) -o -type f -print0
}

# Return 0 if we consider this a code file; 1 otherwise.
is_code_file() {
  local f="$1"
  local bn
  bn="$(basename "$f")"

  # Ignore dotfiles (mostly configs)
  case "$bn" in
    .* ) return 1 ;;
  esac

  # Ignore common config-ish JS/TS even though they look like "code"
  case "$bn" in
    *config*.js|*config*.ts|*config*.cjs|*config*.mjs| \
    *rc.js|*rc.ts|*rc.cjs|*rc.mjs| \
    *.conf.js|*.conf.ts| \
    webpack.*|vite.*|jest.*|babel.*|rollup.*|gulpfile.js|Gruntfile.js|karma.conf.js )
      return 1 ;;
  esac

  # Ignore minified / sourcemaps
  case "$f" in
    *.min.js|*.min.css|*.map ) return 1 ;;
  esac

  # Allowlist source extensions (adjust as you like)
  case "$f" in
    *.sh|*.bash|*.zsh|*.py|*.rb|*.pl|*.pm| \
    *.js|*.jsx|*.ts|*.tsx|*.java|*.kt|*.go|*.rs| \
    *.c|*.h|*.cc|*.cpp|*.cxx|*.hpp|*.cs| \
    *.php|*.swift|*.scala|*.lua|*.r|*.m|*.sql| \
    *.css|*.scss|*.less|*.html|*.htm|*.xml|*.dart )
      return 0 ;;
    * ) return 1 ;;
  esac
}

# Count LOC (non-blank, minus comments) with simple, pragmatic comment handling per family.
count_loc() {
  local f="$1"
  local ext style
  ext="${f##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"

  case "$ext" in
    sh|bash|zsh|py|rb|pl|pm|r) style="hash" ;;
    sql)                       style="sql"  ;;
    html|htm|xml)              style="html" ;;
    css|scss|less|c|h|cc|cpp|cxx|hpp|java|js|jsx|ts|tsx|go|rs|cs|kt|swift|php|dart)
                               style="c"    ;;
    *)                         style="plain";;
  esac

  case "$style" in
    plain)
      awk 'NF{c++} END{print c+0}' "$f"
      ;;
    hash) # ignores lines starting with #, but keeps shebang (#!)
      awk '
        { sub(/\r$/,"") }
        /^[ \t]*$/ { next }
        /^[ \t]*#/ && $0 !~ /^[ \t]*#!/ { next }
        { c++ }
        END{ print c+0 }
      ' "$f"
      ;;
    sql)  # ignores lines starting with --
      awk '
        { sub(/\r$/,"") }
        /^[ \t]*$/ { next }
        /^[ \t]*--/ { next }
        { c++ }
        END{ print c+0 }
      ' "$f"
      ;;
    c)    # handles // and /* ... */ blocks (best-effort)
      awk '
        BEGIN{ c=0; inblock=0 }
        {
          line=$0
          sub(/\r$/,"",line)

          if(inblock){
            if(match(line,/\*\//)){
              line=substr(line,RSTART+2)
              inblock=0
            } else {
              next
            }
          }

          while(match(line,/\/\*/)){
            pre=substr(line,1,RSTART-1)
            post=substr(line,RSTART+2)
            if(match(post,/\*\//)){
              post=substr(post,RSTART+2)
              line=pre post
            } else {
              line=pre
              inblock=1
              break
            }
          }

          tmp=line
          sub(/^[ \t]+/,"",tmp)
          if(tmp ~ /^\/\//) next
          if(tmp ~ /^$/) next
          c++
        }
        END{ print c+0 }
      ' "$f"
      ;;
    html) # handles <!-- ... --> blocks (best-effort)
      awk '
        BEGIN{ c=0; inblock=0 }
        {
          line=$0
          sub(/\r$/,"",line)

          if(inblock){
            if(match(line,/-->/)){
              line=substr(line,RSTART+3)
              inblock=0
            } else {
              next
            }
          }

          while(match(line,/<!--/)){
            pre=substr(line,1,RSTART-1)
            post=substr(line,RSTART+4)
            if(match(post,/-->/)){
              post=substr(post,RSTART+3)
              line=pre post
            } else {
              line=pre
              inblock=1
              break
            }
          }

          tmp=line
          sub(/^[ \t]+/,"",tmp)
          if(tmp ~ /^$/) next
          c++
        }
        END{ print c+0 }
      ' "$f"
      ;;
  esac
}

# Main
while IFS= read -r -d '' f; do
  is_code_file "$f" || continue
  loc="$(count_loc "$f")"
  ext="${f##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  printf "%s\t%s\t%s\n" "$ext" "$loc" "$f" >> "$TMP"
done < <(find_code_files)

if [[ ! -s "$TMP" ]]; then
  echo "No code files found under: $ROOT"
  exit 0
fi

total="$(awk -F'\t' '{s+=$2} END{print s+0}' "$TMP")"
echo "Root: $ROOT"
echo "Total LOC (non-blank, minus comments): $total"
echo

echo "By extension:"
awk -F'\t' '{sum[$1]+=$2; files[$1]++} END{for(e in sum) printf "%s\t%d\t%d\n", e, files[e], sum[e]}' "$TMP" \
  | sort -t$'\t' -k3,3nr \
  | awk -F'\t' 'BEGIN{printf "%-8s %8s %10s\n","Ext","Files","LOC"} {printf "%-8s %8d %10d\n",$1,$2,$3}'

echo
