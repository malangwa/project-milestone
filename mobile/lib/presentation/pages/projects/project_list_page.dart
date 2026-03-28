import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/routes.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/project_service.dart';

class ProjectListPage extends StatefulWidget {
  const ProjectListPage({super.key});

  @override
  State<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends State<ProjectListPage> {
  late Future<List<ProjectModel>> _future;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = ProjectService.instance.getProjects();
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Search projects',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) => setState(() => _query = value.trim().toLowerCase()),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              setState(() => _future = ProjectService.instance.getProjects());
              await _future;
            },
            child: FutureBuilder<List<ProjectModel>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return ListView(
                    padding: const EdgeInsets.all(24),
                    children: const [
                      SizedBox(height: 120),
                      Text(
                        'Failed to load projects',
                        textAlign: TextAlign.center,
                      ),
                    ],
                  );
                }

                final projects = snapshot.data!
                    .where(
                      (project) =>
                          _query.isEmpty ||
                          project.name.toLowerCase().contains(_query) ||
                          (project.location ?? '').toLowerCase().contains(_query),
                    )
                    .toList();

                if (projects.isEmpty) {
                  return ListView(
                    padding: const EdgeInsets.all(24),
                    children: const [
                      SizedBox(height: 120),
                      Text('No projects match your search.'),
                    ],
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: projects.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final project = projects[index];
                    return Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(project.name),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if ((project.description ?? '').isNotEmpty)
                                Text(project.description!),
                              const SizedBox(height: 6),
                              Text(
                                [
                                  project.industry,
                                  if ((project.location ?? '').isNotEmpty)
                                    project.location!,
                                  'Budget ${currency.format(project.budget)}',
                                ].join(' • '),
                              ),
                            ],
                          ),
                        ),
                        trailing: Chip(
                          label: Text(project.status.replaceAll('_', ' ')),
                        ),
                        onTap: () {
                          Navigator.of(context).pushNamed(
                            AppRoutes.projectDetail,
                            arguments: project.id,
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
