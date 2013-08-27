JsonTree=function(json){
    this.support={'json':1,'javascript':1,'css':1,'html':1}
    this.code = code;
    return this.pass();
};
JsonTree.prototype={
    pass:function(){
        var result = {};
        result = hljs.highlightAuto(this.code);
        if(this.support.indexOf(result.language) > 0){
            return this[result.language]();
        }else{
            
        }
    },
    json: function(){
        var jsondata = null;
        try{
            jsondata = JSON.parse(this.code);
        }catch(e){
            return {'language':'json','code':this.code};
        }
        if(!jsondata){
            return {'language':'json','code':this.code};
        }
        return {'language':'json','code':hljs.highlight('json',JSON.stringify(jsondata,'undefined',4)).value};
    },
    javascript:function(){
        
    }
};
function jsontree(json){
    return new JsonTree(json);
}