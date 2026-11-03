/** Group Compose projects first, then related hyphen/underscore-separated names. */
export type GroupItem = {ID:string; ImageID?:string; Names?:string; Repository?:string; Labels?:string; State?:string};
export type GroupInventory = {images:GroupItem[]; containers:GroupItem[]};
export function projectLabel(labels?:string):string|undefined {
  return labels?.split(',').map(value => value.trim()).find(value => value.startsWith('com.docker.compose.project='))?.slice('com.docker.compose.project='.length) || undefined;
}
function nameOf(item:GroupItem):string {return (item.Names || item.Repository || '').replace(/^\//,'');}
function related(name:string, prefix:string):boolean {return name === prefix || name.startsWith(prefix+'-') || name.startsWith(prefix+'_');}
export function makeGroupResolver(inventory:GroupInventory):(item:GroupItem)=>string {
  const all = [...inventory.containers,...inventory.images];
  const imageProjects = new Map<string,Set<string>>();
  const projects = new Set<string>();
  for (const item of all) {
    const project=projectLabel(item.Labels);
    if (project) {
      projects.add(project);
      const id=item.ImageID || (!item.Names ? item.ID : undefined);
      if (id) {const set=imageProjects.get(id) || new Set<string>();set.add(project);imageProjects.set(id,set);}
    }
  }
  const known=[...projects].sort((a,b)=>b.length-a.length || a.localeCompare(b));
  const names=[...new Set(all.map(nameOf).filter(name=>name && name!=='<none>'))];
  const branches=new Map<string,Set<string>>();
  for (const name of names) {
    const tokens=name.split(/[-_]/);
    for (let length=1;length<tokens.length;length++) {
      const prefix=tokens.slice(0,length).join('-');
      const next=branches.get(prefix)||new Set<string>();next.add(tokens[length]);branches.set(prefix,next);
    }
    if (branches.has(name)) branches.get(name)!.add('');
  }
  // Include terminal names independently of iteration order (e.g. app and app-api).
  for (const name of names) if(branches.has(name)) branches.get(name)!.add('');
  const inferred=[...branches].filter(([,next])=>next.size>1).map(([prefix])=>prefix).filter(prefix => !known.some(project => related(project,prefix))).sort((a,b)=>a.length-b.length || a.localeCompare(b));
  return item => {
    const explicit=projectLabel(item.Labels);
    if(explicit) return explicit;
    const associated=imageProjects.get(item.ImageID || item.ID);
    if(associated?.size===1) return [...associated][0];
    const name=nameOf(item);
    const project=known.find(prefix=>related(name,prefix));
    if(project) return project;
    return inferred.find(prefix=>related(name.replace(/_/g,'-'),prefix)) || 'Other';
  };
}
export function groupItems<T extends GroupItem>(items:T[], resolve:(item:T)=>string):{name:string; items:T[]}[] {
 const grouped=new Map<string,T[]>();
 for(const item of items){const key=resolve(item);const rows=grouped.get(key)||[];rows.push(item);grouped.set(key,rows);}
 return [...grouped].sort(([a],[b])=>a==='Other'?1:b==='Other'?-1:a.localeCompare(b)).map(([name,rows])=>({name,items:rows}));
}
