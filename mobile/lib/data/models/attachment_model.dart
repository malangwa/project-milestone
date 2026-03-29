class AttachmentModel {
  AttachmentModel({
    required this.id,
    required this.filename,
    required this.url,
    this.storageKey,
    this.mimeType,
    this.size,
    this.description,
    this.entityType,
    this.entityId,
    this.createdAt,
  });

  factory AttachmentModel.fromJson(Map<String, dynamic> json) {
    return AttachmentModel(
      id: json['id']?.toString() ?? '',
      filename: json['filename']?.toString() ?? 'Unnamed file',
      url: json['url']?.toString() ?? '',
      storageKey: json['storageKey']?.toString(),
      mimeType: json['mimeType']?.toString(),
      size: json['size'] is num ? (json['size'] as num).toInt() : null,
      description: json['description']?.toString(),
      entityType: json['entityType']?.toString(),
      entityId: json['entityId']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  final String id;
  final String filename;
  final String url;
  final String? storageKey;
  final String? mimeType;
  final int? size;
  final String? description;
  final String? entityType;
  final String? entityId;
  final String? createdAt;

  String get sizeLabel {
    if (size == null) return '';
    if (size! < 1024) return '$size B';
    if (size! < 1024 * 1024) return '${(size! / 1024).toStringAsFixed(1)} KB';
    return '${(size! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
