class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.role,
    this.isActive,
  });

  final String id;
  final String name;
  final String email;
  final String? role;
  final bool? isActive;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String?,
      isActive: json['isActive'] as bool?,
    );
  }
}
