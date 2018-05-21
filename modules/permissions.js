function permissions(array) {
  this.allPermissions = array;
  this.ints = [];
  for (let i in array)
    this.ints.push(i);
  this.checkPermission = function(usersPermission, requiredPermission) {
    return (this.getInt(usersPermission) >= this.getInt(requiredPermission));

  };
  this.getInt = function(permissionTarget) {
    for (let i in this.allPermissions)
      if (this.allPermissions[i] === permissionTarget)
        return i;
    return -1;
  };
  return this;
}
module.exports = permissions;
